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

export type AiQuotaReservation = { quotaDay: string; stages: number };

export async function reserveAiStages(userId: string, stages: number): Promise<AiQuotaReservation> {
  if (!userId || !Number.isSafeInteger(stages) || stages < 1 || stages > 6) {
    throw new Error("Invalid AI stage reservation");
  }

  const userLimit = dailyStageLimit(process.env.AI_DAILY_USER_STAGE_LIMIT, DEFAULT_USER_DAILY_AI_STAGES);
  const globalLimit = dailyStageLimit(process.env.AI_DAILY_GLOBAL_STAGE_LIMIT, DEFAULT_GLOBAL_DAILY_AI_STAGES);
  if (stages > userLimit) throw new AiQuotaExceededError("user");
  if (stages > globalLimit) throw new AiQuotaExceededError("global");

  await ensureQuotaTable();
  const userKey = `user:${createHash("sha256").update(userId).digest("hex")}`;
  // Pin UTC day before the transaction so a midnight boundary cannot split a reservation.
  const quotaDay = new Date().toISOString().slice(0, 10);

  // Both reservations are in one DB transaction; if either fails, no stages
  // are charged. Unique keys + UPSERT provide atomic cross-instance limits.
  await db.transaction(async (tx) => {
    for (const { key, limit, scope } of [
      { key: "global", limit: globalLimit, scope: "global" as const },
      { key: userKey, limit: userLimit, scope: "user" as const },
    ]) {
      const result = await tx.execute(sql`
        INSERT INTO ai_analysis_usage (quota_key, quota_day, used_stages)
        VALUES (${key}, ${quotaDay}::date, ${stages})
        ON CONFLICT (quota_key, quota_day) DO UPDATE
          SET used_stages = ai_analysis_usage.used_stages + EXCLUDED.used_stages,
              updated_at = NOW()
          WHERE ai_analysis_usage.used_stages + EXCLUDED.used_stages <= ${limit}
        RETURNING used_stages
      `);
      if (result.rows.length === 0) throw new AiQuotaExceededError(scope);
    }
  });
  return { quotaDay, stages };
}

/**
 * Restore a reservation when the external AI provider rejected the request.
 * Both the per-user and shared counters are restored atomically, for the exact
 * UTC date originally reserved. No other users' reservations are affected.
 */
export async function releaseAiStages(userId: string, reservation: AiQuotaReservation): Promise<void> {
  if (!userId || !Number.isSafeInteger(reservation.stages) || reservation.stages < 1 || reservation.stages > 6
    || !/^\d{4}-\d{2}-\d{2}$/.test(reservation.quotaDay)) {
    throw new Error("Invalid AI quota release");
  }
  const userKey = `user:${createHash("sha256").update(userId).digest("hex")}`;
  await db.transaction(async (tx) => {
    for (const key of ["global", userKey]) {
      const result = await tx.execute(sql`
        UPDATE ai_analysis_usage
        SET used_stages = used_stages - ${reservation.stages}, updated_at = NOW()
        WHERE quota_key = ${key}
          AND quota_day = ${reservation.quotaDay}::date
          AND used_stages >= ${reservation.stages}
        RETURNING used_stages
      `);
      if (result.rows.length !== 1) throw new Error("Unable to release AI quota reservation");
    }
  });
}
