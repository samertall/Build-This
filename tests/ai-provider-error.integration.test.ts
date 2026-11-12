import { describe, expect, it } from "vitest";
import { classifyAiProviderError } from "../artifacts/api-server/src/lib/ai-provider-error";

describe("OpenAI provider failure diagnostics", () => {
  it("identifies exhausted API credits without leaking provider internals", () => {
    const err = { status: 429, code: "credit_balance_exhausted", message: "Sensitive provider request details" };
    expect(classifyAiProviderError(err)).toEqual({
      status: 503,
      code: "ai_credits_exhausted",
      message: expect.stringContaining("OpenAI API credits are exhausted"),
      refundReservation: true,
    });
    expect(classifyAiProviderError(err).message).not.toContain("Sensitive provider");
  });

  it("distinguishes provider rate limits from the app's daily quota", () => {
    expect(classifyAiProviderError({ status: 429, code: "rate_limit_exceeded" })).toMatchObject({
      status: 503, code: "ai_provider_rate_limited", refundReservation: true, retryAfter: 60,
    });
  });

  it("uses a generic error for unknown exceptions, not billing advice", () => {
    expect(classifyAiProviderError(new Error("Unexpected persistence failure"))).toMatchObject({
      status: 500, code: "ai_analysis_failed", refundReservation: false,
    });
  });

  it("reports provider configuration failures without exposing credentials", () => {
    expect(classifyAiProviderError({ status: 401, code: "invalid_api_key" })).toMatchObject({
      status: 503, code: "ai_provider_not_configured", refundReservation: true,
    });
  });
});
