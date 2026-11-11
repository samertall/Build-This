import { createHash } from "node:crypto";
import { db, pool } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  AiQuotaExceededError,
  dailyStageLimit,
  DEFAULT_GLOBAL_DAILY_AI_STAGES,
  DEFAULT_USER_DAILY_AI_STAGES,
} from "./ai-quota-rules.js";
export { AiQuotaExceededError, requestedStageCount } from "./ai-quota-rules.js";

// Conservative launch defaults: four complete six-stage analyses per user/day,
// and 25 across all users/day. Override only after reviewing provider spend.

let schemaPromise: Promise<void> | undefined;

/** Additive, isolated bootstrap; serialized across concurrent Vercel instances. */
async function ensureQuotaTable(): Promise<void> {
  schemaPromise ??= (async () => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(20261111)");
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_analysis_usage (
          quota_key TEXT NOT NULL,
          quota_day DATE NOT NULL,
          used_stages INTEGER NOT NULL CHECK (used_stages >= 0),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (quota_key, quota_day)
        )
      `);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })().catch((error) => {
    schemaPromise = undefined;
    throw error;
  });
  return schemaPromise;
}

export async function reserveAiStages(userId: string, stages: number): Promise<void> {
  if (!userId || !Number.isSafeInteger(stages) || stages < 1 || stages > 6) {
    throw new Error("Invalid AI stage reservation");
  }

  const userLimit = dailyStageLimit(process.env.AI_DAILY_USER_STAGE_LIMIT, DEFAULT_USER_DAILY_AI_STAGES);
  const globalLimit = dailyStageLimit(process.env.AI_DAILY_GLOBAL_STAGE_LIMIT, DEFAULT_GLOBAL_DAILY_AI_STAGES);
  if (stages > userLimit) throw new AiQuotaExceededError("user");
  if (stages > globalLimit) throw new AiQuotaExceededError("global");

  await ensureQuotaTable();
  const userKey = `user:${createHash("sha256").update(userId).digest("hex")}`;

  // Both reservations are in one DB transaction; if either fails, no stages
  // are charged. Unique keys + UPSERT provide atomic cross-instance limits.
  await db.transaction(async (tx) => {
    for (const { key, limit, scope } of [
      { key: "global", limit: globalLimit, scope: "global" as const },
      { key: userKey, limit: userLimit, scope: "user" as const },
    ]) {
      const result = await tx.execute(sql`
        INSERT INTO ai_analysis_usage (quota_key, quota_day, used_stages)
        VALUES (${key}, (NOW() AT TIME ZONE 'UTC')::DATE, ${stages})
        ON CONFLICT (quota_key, quota_day) DO UPDATE
          SET used_stages = ai_analysis_usage.used_stages + EXCLUDED.used_stages,
              updated_at = NOW()
          WHERE ai_analysis_usage.used_stages + EXCLUDED.used_stages <= ${limit}
        RETURNING used_stages
      `);
      if (result.rows.length === 0) throw new AiQuotaExceededError(scope);
    }
  });
}
