export const DEFAULT_USER_DAILY_AI_STAGES = 24;
export const DEFAULT_GLOBAL_DAILY_AI_STAGES = 150;

export class AiQuotaExceededError extends Error {
  constructor(public readonly scope: "user" | "global") {
    super(scope === "user"
      ? "Your daily AI analysis allowance is exhausted. Try again tomorrow (UTC)."
      : "Today's shared AI analysis allowance is exhausted. Try again tomorrow (UTC).");
    this.name = "AiQuotaExceededError";
  }
}

export function dailyStageLimit(value: string | undefined, fallback: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= 10_000 ? parsed : fallback;
}

export function requestedStageCount(agentTypes: string[]): number {
  // The pipeline treats [] as 'all' for backwards compatibility.
  return agentTypes.length === 0 || agentTypes.includes("all") ? 6 : new Set(agentTypes).size;
}

/** HTTP Retry-After for daily limits, using the same UTC reset as the database. */
export function secondsUntilUtcMidnight(now: Date = new Date()): number {
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(1, Math.ceil((tomorrow - now.getTime()) / 1000));
}
