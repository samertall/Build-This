import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db, pool, projectsTable } from "../lib/db/src";
import { eq, sql } from "drizzle-orm";
import projectsRouter from "../artifacts/api-server/src/routes/projects";
import { createRequireAuth } from "../artifacts/api-server/src/middlewares/auth";

// Force the built-in provider-configuration failure without making any network calls.
// The pure classifier unit tests separately exercise the exact credit_balance_exhausted
// payload from the Vercel incident.
const TEST_OWNER = "ci-no-credit-owner";
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
const asOwner = (query: request.Test) => query.set("x-test-user-id", TEST_OWNER);
let projectId: number | undefined;

beforeAll(() => {
  if (!process.env.DATABASE_URL?.includes("localhost")) {
    throw new Error("Provider-billing test must use disposable localhost PostgreSQL");
  }
  vi.stubEnv("ALLOW_AI_MOCK_FALLBACK", "false");
  vi.stubEnv("AI_PROVIDER", "gemini");
  vi.stubEnv("GEMINI_API_KEY", "");
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("AI_DAILY_USER_STAGE_LIMIT", "24");
  vi.stubEnv("AI_DAILY_GLOBAL_STAGE_LIMIT", "150");
});

afterAll(async () => {
  if (projectId !== undefined) {
    await db.delete(projectsTable).where(eq(projectsTable.id, projectId));
  }
  vi.unstubAllEnvs();
  await pool.end();
});

async function globalUsage(): Promise<number> {
  const rows = await db.execute(sql`
    SELECT used_stages
    FROM ai_analysis_usage
    WHERE quota_key = 'global' AND quota_day = (NOW() AT TIME ZONE 'UTC')::date
  `);
  return Number(rows.rows[0]?.used_stages ?? 0);
}

describe("provider outage quota release (no provider calls, real local database)", () => {
  it("returns actionable 503, restores quotas and permits a retry without a fake result", async () => {
    const created = await asOwner(request(app).post("/api/projects")).send({
      name: "Synthetic provider credit outage project",
      productType: "SaaS",
    });
    expect(created.status, JSON.stringify(created.body)).toBe(201);
    projectId = created.body.id as number;

    const initial = await globalUsage();
    const endpoint = `/api/projects/${projectId}/analyze`;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await asOwner(request(app).post(endpoint)).send({
        agentTypes: ["research", "problems", "strategy", "journeys", "features", "tasks"],
      });
      expect(result.status, JSON.stringify(result.body)).toBe(503);
      expect(result.body).toEqual({
        code: "ai_provider_not_configured",
        error: expect.stringContaining("The AI provider cannot be authenticated"),
      });
      expect(await globalUsage()).toBe(initial);
    }

    const status = await asOwner(request(app).get(`/api/projects/${projectId}`));
    expect(status.status).toBe(200);
    expect(status.body.analysisStatus).toBe("error");

    const insights = await asOwner(request(app).get(`/api/projects/${projectId}/insights`));
    expect(insights.status).toBe(200);
    expect(insights.body).toHaveLength(0);
  });
});
