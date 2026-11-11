import { afterEach, describe, expect, it, vi } from "vitest";
import {
  handleAgentFailure,
  parseAgentItems,
  testMockFallbackEnabled,
} from "../artifacts/api-server/src/lib/ai-guard";

afterEach(() => vi.unstubAllEnvs());

describe("production AI output safety", () => {
  it("rejects provider errors in production even if mock mode is requested", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_AI_MOCK_FALLBACK", "true");
    const mock = vi.fn(() => [{ insight: "fabricated" }]);
    expect(testMockFallbackEnabled()).toBe(false);
    expect(() => handleAgentFailure(new Error("Provider unavailable"), mock)).toThrow("Provider unavailable");
    expect(mock).not.toHaveBeenCalled();
  });

  it("requires an explicit opt-in even in a test process", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ALLOW_AI_MOCK_FALLBACK", "false");
    expect(() => handleAgentFailure(new Error("Rate limited"), () => ["mock"])).toThrow("Rate limited");
  });

  it("allows sample output only when explicitly opted in during tests", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ALLOW_AI_MOCK_FALLBACK", "true");
    expect(handleAgentFailure(new Error("Test failure"), () => ["sample"])).toEqual(["sample"]);
  });

  it("rejects empty and invalid AI result arrays", () => {
    expect(() => parseAgentItems("{}", "insights")).toThrow("invalid or empty");
    expect(() => parseAgentItems('{"insights":[]}', "insights")).toThrow("invalid or empty");
    expect(() => parseAgentItems('{"insights":"wrong"}', "insights")).toThrow("invalid or empty");
    expect(parseAgentItems<{ insight: string }>('{"insights":[{"insight":"Verified text"}]}', "insights"))
      .toEqual([{ insight: "Verified text" }]);
  });
});
