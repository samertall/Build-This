import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AiQuotaExceededError,
  dailyStageLimit,
  requestedStageCount,
  secondsUntilUtcMidnight,
} from "../artifacts/api-server/src/lib/ai-quota-rules";
import { previewDatabaseIsUnsafe } from "../artifacts/api-server/src/middlewares/preview-database-guard";

afterEach(() => vi.unstubAllEnvs());

describe("launch safeguards", () => {
  it("blocks a preview deployment from querying the shared database by default", () => {
    expect(previewDatabaseIsUnsafe({ VERCEL_ENV: "preview" })).toBe(true);
    expect(previewDatabaseIsUnsafe({ VERCEL_TARGET_ENV: "preview" })).toBe(true);
    expect(previewDatabaseIsUnsafe({ VERCEL_ENV: "preview", PREVIEW_DATABASE_ISOLATED: "true" })).toBe(false);
    expect(previewDatabaseIsUnsafe({ VERCEL_ENV: "production" })).toBe(false);
  });

  it("counts full and partial pipeline stages correctly", () => {
    expect(requestedStageCount(["all"])).toBe(6);
    expect(requestedStageCount([])).toBe(6);
    expect(requestedStageCount(["all", "research"])).toBe(6);
    expect(requestedStageCount(["research", "strategy", "research"])).toBe(2);
  });

  it("bounds configuration values to a safe positive integer", () => {
    expect(dailyStageLimit(undefined, 24)).toBe(24);
    expect(dailyStageLimit("0", 24)).toBe(24);
    expect(dailyStageLimit("Infinity", 24)).toBe(24);
    expect(dailyStageLimit("5", 24)).toBe(5);
    expect(dailyStageLimit("10000000", 24)).toBe(24);
  });

  it("provides a clear, retryable rate-limit message", () => {
    expect(new AiQuotaExceededError("user").message).toContain("daily AI analysis allowance");
    expect(new AiQuotaExceededError("global").message).toContain("shared AI analysis allowance");
  });

  it("calculates a correct reset interval across UTC midnight", () => {
    expect(secondsUntilUtcMidnight(new Date("2026-11-11T23:59:30Z"))).toBe(30);
    expect(secondsUntilUtcMidnight(new Date("2026-11-11T00:00:00Z"))).toBe(86_400);
  });
});
