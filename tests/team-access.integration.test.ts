import express from "express";
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequireAuth } from "../artifacts/api-server/src/middlewares/auth";
import projectsRouter from "../artifacts/api-server/src/routes/projects";
import {
  approvalEventsTable,
  db,
  pool,
  projectCommentsTable,
  projectMembersTable,
  projectsTable,
  researchInsightsTable,
} from "../lib/db/src";
import { and, eq } from "drizzle-orm";

const OWNER_ID = "team-access-owner";
const OWNER_EMAIL = "owner@example.com";
const REVIEWER_ID = "team-access-reviewer";
const REVIEWER_EMAIL = "reviewer@example.com";
const INVITEE_ID = "team-access-invitee";
const INVITEE_EMAIL = "invited@example.com";

const clerkTestState = {
  primaryEmails: new Map<string, string>(),
};
const getPrimaryEmail = vi.fn(async (userId: string) => clerkTestState.primaryEmails.get(userId));
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn() } as never;
  next();
});
app.use("/api", createRequireAuth({
  getUserId: (req) => req.header("x-test-user-id") ?? null,
  getPrimaryEmail,
}));
app.use("/api", projectsRouter);

let projectId: number;

function asUser(req: request.Test, userId: string, sessionEmail?: string) {
  req.set("x-test-user-id", userId);
  return sessionEmail ? req.set("x-test-session-email", sessionEmail) : req;
}

async function createProject() {
  const [project] = await db.insert(projectsTable).values({
    ownerId: OWNER_ID,
    name: "Team access integration test",
    description: "Initial description",
    status: "active",
  }).returning({ id: projectsTable.id });
  if (!project) throw new Error("Failed to create test project");
  projectId = project.id;
}

async function removeProject() {
  if (projectId) {
    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  }
}

beforeEach(async () => {
  await removeProject();
  clerkTestState.primaryEmails.clear();
  clerkTestState.primaryEmails.set(OWNER_ID, OWNER_EMAIL);
  clerkTestState.primaryEmails.set(REVIEWER_ID, REVIEWER_EMAIL);
  clerkTestState.primaryEmails.set(INVITEE_ID, INVITEE_EMAIL);
  getPrimaryEmail.mockClear();
  await createProject();
});

afterAll(async () => {
  await removeProject();
  await pool.end();
});

describe("team access", () => {
  it("activates an invitation from Clerk's authoritative primary email", async () => {
    const [invitation] = await db.insert(projectMembersTable).values({
      projectId,
      email: INVITEE_EMAIL,
      role: "editor",
      status: "invited",
      invitedBy: OWNER_ID,
    }).returning();

    const response = await asUser(
      request(app).get(`/api/projects/${projectId}`),
      INVITEE_ID,
      "untrusted-session-claim@example.com",
    );

    expect(response.status).toBe(200);
    expect(response.body.accessRole).toBe("editor");
    expect(getPrimaryEmail).toHaveBeenCalledWith(INVITEE_ID);

    const [member] = await db.select().from(projectMembersTable)
      .where(eq(projectMembersTable.id, invitation!.id));
    expect(member?.status).toBe("active");
    expect(member?.userId).toBe(INVITEE_ID);
  });

  it("allows editors to update project configuration but blocks reviewers", async () => {
    await db.insert(projectMembersTable).values({
      projectId,
      userId: "team-access-editor",
      email: "editor@example.com",
      role: "editor",
      status: "active",
      invitedBy: OWNER_ID,
    });
    await db.insert(projectMembersTable).values({
      projectId,
      userId: REVIEWER_ID,
      email: REVIEWER_EMAIL,
      role: "reviewer",
      status: "active",
      invitedBy: OWNER_ID,
    });
    clerkTestState.primaryEmails.set("team-access-editor", "editor@example.com");

    const editorResponse = await asUser(
      request(app).patch(`/api/projects/${projectId}`),
      "team-access-editor",
    )
      .send({ description: "Editor updated the configuration" });
    expect(editorResponse.status).toBe(200);
    expect(editorResponse.body.description).toBe("Editor updated the configuration");

    const reviewerResponse = await asUser(
      request(app).patch(`/api/projects/${projectId}`),
      REVIEWER_ID,
    )
      .send({ description: "Reviewer must not update configuration" });
    expect(reviewerResponse.status).toBe(403);

    const [project] = await db.select().from(projectsTable)
      .where(eq(projectsTable.id, projectId));
    expect(project?.description).toBe("Editor updated the configuration");
  });

  it("rolls back an approval when its audit event cannot be inserted", async () => {
    const [insight] = await db.insert(researchInsightsTable).values({
      projectId,
      insight: "Approval must remain atomic",
    }).returning();
    if (!insight) throw new Error("Failed to create test insight");

    const suffix = `${process.pid}_${Math.floor(Math.random() * 1_000_000)}`;
    const functionName = `fail_approval_event_${suffix}`;
    const triggerName = `fail_approval_event_trigger_${suffix}`;
    await pool.query(`
      CREATE FUNCTION ${functionName}() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'forced approval audit failure';
      END;
      $$ LANGUAGE plpgsql
    `);
    await pool.query(`
      CREATE TRIGGER ${triggerName}
      BEFORE INSERT ON approval_events
      FOR EACH ROW EXECUTE FUNCTION ${functionName}()
    `);

    try {
      const response = await asUser(
        request(app).post(`/api/projects/${projectId}/insights/${insight.id}/approve`),
        OWNER_ID,
      )
        .send({ status: "approved", comment: "This audit insert will fail" });
      expect(response.status).toBe(500);

      const [unchangedInsight] = await db.select().from(researchInsightsTable)
        .where(eq(researchInsightsTable.id, insight.id));
      expect(unchangedInsight?.approvalStatus).toBe("pending");

      const history = await db.select().from(approvalEventsTable).where(and(
        eq(approvalEventsTable.projectId, projectId),
        eq(approvalEventsTable.itemType, "insight"),
        eq(approvalEventsTable.itemId, insight.id),
      ));
      expect(history).toHaveLength(0);
    } finally {
      await pool.query(`DROP TRIGGER IF EXISTS ${triggerName} ON approval_events`);
      await pool.query(`DROP FUNCTION IF EXISTS ${functionName}()`);
    }
  });

  it("exposes comments, members, and approval history to a second session", async () => {
    const [invitation] = await db.insert(projectMembersTable).values({
      projectId,
      email: REVIEWER_EMAIL,
      role: "reviewer",
      status: "invited",
      invitedBy: OWNER_ID,
    }).returning();
    const [insight] = await db.insert(researchInsightsTable).values({
      projectId,
      insight: "Shared session state",
    }).returning();
    if (!invitation || !insight) throw new Error("Failed to seed collaboration data");

    const activation = await asUser(
      request(app).get(`/api/projects/${projectId}`),
      REVIEWER_ID,
    );
    expect(activation.status).toBe(200);

    const commentResponse = await asUser(
      request(app).post(`/api/projects/${projectId}/comments/insight/${insight.id}`),
      OWNER_ID,
    )
      .send({ body: "Visible to the reviewer session" });
    expect(commentResponse.status).toBe(201);

    const approvalResponse = await asUser(
      request(app).post(`/api/projects/${projectId}/insights/${insight.id}/approve`),
      OWNER_ID,
    )
      .send({ status: "approved", comment: "Approved in the owner session" });
    expect(approvalResponse.status).toBe(200);

    const [members, comments, history] = await Promise.all([
      asUser(request(app).get(`/api/projects/${projectId}/members`), REVIEWER_ID),
      asUser(request(app).get(`/api/projects/${projectId}/comments/insight/${insight.id}`), REVIEWER_ID),
      asUser(request(app).get(`/api/projects/${projectId}/approval-history/insight/${insight.id}`), REVIEWER_ID),
    ]);

    expect(members.status).toBe(200);
    expect(members.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: invitation.id,
        status: "active",
        userId: REVIEWER_ID,
      }),
    ]));
    expect(comments.status).toBe(200);
    expect(comments.body).toEqual(expect.arrayContaining([
      expect.objectContaining({ body: "Visible to the reviewer session" }),
    ]));
    expect(history.status).toBe(200);
    expect(history.body).toEqual(expect.arrayContaining([
      expect.objectContaining({
        status: "approved",
        comment: "Approved in the owner session",
        actorId: OWNER_ID,
      }),
    ]));
  });
});