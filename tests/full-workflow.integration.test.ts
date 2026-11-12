import express from "express";
import request from "supertest";
import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import {
  approvalEventsTable,
  db,
  pool,
  projectsTable,
} from "../lib/db/src";
import { createRequireAuth } from "../artifacts/api-server/src/middlewares/auth";
import projectsRouter from "../artifacts/api-server/src/routes/projects";

// CI-only deterministic provider failure; the test runner uses the explicit
// NODE_ENV=test + ALLOW_AI_MOCK_FALLBACK=true guard. No OpenAI requests occur.
// Production rejects mock fallback regardless of this fixture's environment.
vi.mock("openai", () => ({
  OpenAI: class MockOpenAI {
    chat = {
      completions: {
        create: async () => { throw new Error("Synthetic test: provider intentionally offline"); },
      },
    };
  },
}));

const OWNER = "ci-full-workflow-owner";
const OUTSIDER = "ci-full-workflow-outsider";
const app = express();
app.use(express.json());
app.use((req, _res, next) => {
  req.log = { error: vi.fn() } as never;
  next();
});
app.use("/api", createRequireAuth({
  getUserId: (req) => req.header("x-test-user-id") ?? null,
  getPrimaryEmail: async () => undefined,
}));
app.use("/api", projectsRouter);

function asOwner(req: request.Test) {
  return req.set("x-test-user-id", OWNER);
}
function asOutsider(req: request.Test) {
  return req.set("x-test-user-id", OUTSIDER);
}
function binaryParser(response: NodeJS.ReadableStream, callback: (err: Error | null, result: Buffer) => void) {
  const chunks: Buffer[] = [];
  response.on("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
  response.on("error", (err: Error) => callback(err, Buffer.alloc(0)));
  response.on("end", () => callback(null, Buffer.concat(chunks)));
}

let projectId: number | undefined;

afterAll(async () => {
  if (projectId !== undefined) {
    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  }
  await pool.end();
});

describe("complete Build-This API workflow (isolated PostgreSQL, synthetic AI only)", () => {
  it("persists project, source, six stages, approvals, presentation, exports, and quota boundary", async () => {
    if (process.env.NODE_ENV !== "test" || process.env.ALLOW_AI_MOCK_FALLBACK !== "true") {
      throw new Error("Full workflow fixtures require explicit test-only mock fallback");
    }
    expect(process.env.DATABASE_URL).toContain("localhost");

    const unauthenticated = await request(app).post("/api/projects").send({ name: "Rejected" });
    expect(unauthenticated.status).toBe(401);

    const create = await asOwner(request(app).post("/api/projects")).send({
      name: "CI synthetic research project",
      description: "Disposable QA fixture, not real user research",
      productType: "SaaS",
      industry: "Technology",
      businessGoals: "Validate workflow persistence, approval, and export",
      targetUsers: "Synthetic test personas only",
    });
    expect(create.status, JSON.stringify(create.body)).toBe(201);
    projectId = create.body.id as number;

    const privateRead = await asOutsider(request(app).get(`/api/projects/${projectId}`));
    expect(privateRead.status).toBe(404);

    const source = await asOwner(request(app).post(`/api/projects/${projectId}/sources`)).send({
      type: "research_note",
      name: "Synthetic interview research — TEST ONLY",
      content: "Synthetic test: users expect clear progress, accessible controls, and reliable export.",
      classification: "fixture",
    });
    expect(source.status, JSON.stringify(source.body)).toBe(201);

    const sources = await asOwner(request(app).get(`/api/projects/${projectId}/sources`));
    expect(sources.status).toBe(200);
    expect(sources.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: source.body.id })]));

    const analysis = await asOwner(request(app).post(`/api/projects/${projectId}/analyze`)).send({
      agentTypes: ["research", "problems", "strategy", "journeys", "features", "tasks"],
    });
    expect(analysis.status, JSON.stringify(analysis.body)).toBe(200);
    expect(analysis.body.agentsRun).toEqual(["research", "problems", "strategy", "journeys", "features", "tasks"]);
    for (const prop of ["insightsGenerated", "problemsGenerated", "recommendationsGenerated", "featuresGenerated", "tasksGenerated"]) {
      expect(analysis.body[prop], prop).toBeGreaterThan(0);
    }
    expect(analysis.body.usingFallback).toBe(true);

    const outputs = await Promise.all(
      ["insights", "problems", "recommendations", "journeys", "features", "tasks"].map(path =>
        asOwner(request(app).get(`/api/projects/${projectId}/${path}`)),
      ),
    );
    for (const output of outputs) {
      expect(output.status).toBe(200);
      expect(output.body.length).toBeGreaterThan(0);
    }

    const approvals = [
      ["insights", outputs[0].body[0].id, "insightId"],
      ["problems", outputs[1].body[0].id, "problemId"],
      ["recommendations", outputs[2].body[0].id, "recId"],
    ] as const;
    for (const [path, itemId] of approvals) {
      const approval = await asOwner(request(app).post(`/api/projects/${projectId}/${path}/${itemId}/approve`))
        .send({ status: "approved", comment: "CI synthetic approval only" });
      expect(approval.status, JSON.stringify(approval.body)).toBe(200);
      expect(approval.body.approvalStatus).toBe("approved");
    }

    const audit = await db.select().from(approvalEventsTable).where(eq(approvalEventsTable.projectId, projectId));
    expect(audit.length).toBe(3);

    const presentation = await asOwner(request(app).post(`/api/projects/${projectId}/presentations`)).send({
      title: "CI synthetic research readout",
      presentationType: "project-pitch",
      audience: "QA reviewers",
    });
    expect(presentation.status, JSON.stringify(presentation.body)).toBe(201);
    expect(presentation.body.slides.length).toBeGreaterThan(0);

    const exports = [
      { type: "pdf", contentType: "application/pdf", signature: "255044462d" },
      { type: "pptx", contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", signature: "504b0304" },
    ];
    for (const { type, contentType, signature } of exports) {
      const result = await asOwner(
        request(app).get(`/api/projects/${projectId}/presentations/${presentation.body.id}/export/${type}`)
          .buffer(true).parse(binaryParser),
      );
      expect(result.status, `${type}: ${JSON.stringify(result.body)}`).toBe(200);
      expect(result.headers["content-type"]).toBe(contentType);
      expect(result.body).toBeInstanceOf(Buffer);
      expect(result.body.subarray(0, signature.length / 2).toString("hex")).toBe(signature);
      expect(result.headers["cache-control"]).toBe("private, no-store");
    }

    const quota = await asOwner(request(app).post(`/api/projects/${projectId}/analyze`)).send({
      agentTypes: ["research", "problems", "strategy", "journeys", "features", "tasks"],
    });
    expect(quota.status, JSON.stringify(quota.body)).toBe(429);
    expect(quota.headers["retry-after"]).toBeDefined();

    const persisted = await asOwner(request(app).get(`/api/projects/${projectId}`));
    expect(persisted.status).toBe(200);
    expect(persisted.body.analysisStatus).toBe("complete");
  }, 120_000);
});
