import { expect, request as apiRequest, test } from "@playwright/test";
import { eq } from "drizzle-orm";
import {
  db,
  pool,
  projectsTable,
  researchInsightsTable,
} from "../lib/db/src";

const OWNER_ID = "team-review-browser-owner";
const OWNER_EMAIL = "team-review-owner@example.com";
const TEST_HEADERS = {
  "x-test-user-id": OWNER_ID,
  "x-test-session-email": OWNER_EMAIL,
};

let projectId: number;
let insightId: number;

test.describe.configure({ mode: "serial" });

test.beforeEach(async () => {
  const [project] = await db.insert(projectsTable).values({
    ownerId: OWNER_ID,
    name: "Team review browser check",
    description: "A project seeded for the authenticated collaboration journey.",
    status: "active",
    analysisStatus: "complete",
  }).returning({ id: projectsTable.id });
  if (!project) throw new Error("Failed to seed browser test project");
  projectId = project.id;

  const [insight] = await db.insert(researchInsightsTable).values({
    projectId,
    insight: "Customers need a clearer path through the review workflow.",
    evidence: "Browser regression fixture",
    cluster: "Workflow",
    confidence: "high",
    approvalStatus: "pending",
  }).returning({ id: researchInsightsTable.id });
  if (!insight) throw new Error("Failed to seed browser test insight");
  insightId = insight.id;
});

test.afterEach(async () => {
  if (projectId) {
    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  }
});

test.afterAll(async () => {
  await pool.end();
});

test("authenticated owner can manage members, comment, and review approval history", async ({ page }) => {
  const api = await apiRequest.newContext({
    baseURL: "http://127.0.0.1:5001",
    extraHTTPHeaders: TEST_HEADERS,
  });
  await page.setExtraHTTPHeaders(TEST_HEADERS);

  const projectResponse = await api.get(`/api/projects/${projectId}`);
  expect(projectResponse.ok()).toBe(true);
  expect((await projectResponse.json()).accessRole).toBe("owner");

  await page.goto(`/projects/${projectId}`);
  await expect(page.getByRole("heading", { name: "Team review browser check" })).toBeVisible();

  await page.getByRole("button", { name: "Team", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Project team" })).toBeVisible();

  const invitedEmail = `reviewer-${Date.now()}@example.com`;
  await page.getByLabel("Email").fill(invitedEmail);
  await page.getByRole("button", { name: "Invite" }).click();

  const memberRow = page.getByTestId("project-member-row").filter({ hasText: invitedEmail });
  await expect(memberRow).toContainText("Invitation pending");
  await expect(memberRow).toContainText("reviewer");

  await memberRow.getByRole("button", { name: "Member actions" }).click();
  await page.getByRole("menuitem", { name: "Make editor" }).click();
  await expect(memberRow).toContainText("editor");

  await memberRow.getByRole("button", { name: "Member actions" }).click();
  await page.getByRole("menuitem", { name: "Remove" }).click();
  await expect(page.getByTestId("project-member-row").filter({ hasText: invitedEmail })).toHaveCount(0);
  const membersResponse = await api.get(`/api/projects/${projectId}/members`);
  expect(membersResponse.ok()).toBe(true);
  expect(await membersResponse.json()).not.toContainEqual(
    expect.objectContaining({ email: invitedEmail }),
  );

  await page.goto(`/projects/${projectId}/insights`);
  await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();
  await expect(page.getByText("Customers need a clearer path through the review workflow.")).toBeVisible();

  await page.getByRole("button", { name: "Discuss" }).click();
  await expect(page.getByRole("heading", { name: "Team review" })).toBeVisible();

  const reviewComment = "The workflow needs one explicit handoff before approval.";
  await page.getByPlaceholder("Share feedback or ask a question…").fill(reviewComment);
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.getByText(reviewComment)).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByTitle("Approve").click();
  const approvalComment = "Approved after the team handoff review.";
  await page.getByLabel("Rationale (optional)").fill(approvalComment);
  await page.getByRole("button", { name: "Record decision" }).click();

  await page.getByRole("button", { name: "Discuss" }).click();
  await expect(page.getByText(`${OWNER_EMAIL} approved this item`)).toBeVisible();
  await expect(page.getByText(approvalComment)).toBeVisible();

  const [commentsResponse, historyResponse] = await Promise.all([
    api.get(`/api/projects/${projectId}/comments/insight/${insightId}`),
    api.get(`/api/projects/${projectId}/approval-history/insight/${insightId}`),
  ]);
  expect(commentsResponse.ok()).toBe(true);
  expect(historyResponse.ok()).toBe(true);
  expect(await commentsResponse.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({ body: reviewComment, authorId: OWNER_ID }),
  ]));
  expect(await historyResponse.json()).toEqual(expect.arrayContaining([
    expect.objectContaining({
      status: "approved",
      comment: approvalComment,
      actorId: OWNER_ID,
    }),
  ]));

  await api.dispose();
});