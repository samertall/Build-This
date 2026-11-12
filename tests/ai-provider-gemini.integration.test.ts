import { describe, expect, it, vi } from "vitest";
import { GEMINI_OPENAI_BASE_URL, resolveAiProviderSettings, requestAiJson, AiProviderConfigurationError } from "../artifacts/api-server/src/lib/ai-provider";
import { classifyAiProviderError } from "../artifacts/api-server/src/lib/ai-provider-error";

describe("Build-This Gemini API integration (offline/no paid credits)", () => {
  it("defaults to Gemini and never silently invokes OpenAI", () => {
    expect(resolveAiProviderSettings({ GEMINI_API_KEY: "test-key" })).toMatchObject({
      provider: "gemini",
      model: "gemini-3.1-flash-lite",
      baseURL: GEMINI_OPENAI_BASE_URL,
    });
    expect(() => resolveAiProviderSettings({ OPENAI_API_KEY: "paid-openai-key" }))
      .toThrow(AiProviderConfigurationError);
  });

  it("uses explicit OpenAI selection only when administrators request it", () => {
    expect(resolveAiProviderSettings({ AI_PROVIDER: "openai", OPENAI_API_KEY: "test-openai-key" }))
      .toMatchObject({ provider: "openai", model: "gpt-4o-mini" });
  });

  it("rejects missing Gemini keys with actionable setup instructions", () => {
    const error = (() => {
      try { resolveAiProviderSettings({ AI_PROVIDER: "gemini" }); } catch (e) { return e; }
    })();
    expect(error).toBeInstanceOf(AiProviderConfigurationError);
    expect(classifyAiProviderError(error)).toMatchObject({
      status: 503, code: "ai_provider_not_configured", refundReservation: true,
    });
  });

  it("sends JSON-mode requests to Google's Gemini endpoint without contacting OpenAI", async () => {
    const spy = vi.fn(async () => new Response(JSON.stringify({
      id: "gemini-offline-test", object: "chat.completion", created: 1,
      model: "gemini-3.1-flash-lite",
      choices: [{ index: 0, message: { role: "assistant", content: '{"insights":[{"insight":"Synthetic finding"}]}' }, finish_reason: "stop" }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const output = await requestAiJson("Return JSON with insights", "Synthetic source", {
      env: { AI_PROVIDER: "gemini", GEMINI_API_KEY: "test-gemini-key" },
      fetcher: spy as typeof fetch,
    });
    expect(JSON.parse(output)).toEqual({ insights: [{ insight: "Synthetic finding" }] });
    expect(spy).toHaveBeenCalledOnce();
    const [url, request] = spy.mock.calls[0] as unknown as [RequestInfo | URL, RequestInit];
    expect(String(url)).toBe(GEMINI_OPENAI_BASE_URL + "chat/completions");
    const headers = new Headers(request.headers);
    expect(headers.get("authorization")).toBe("Bearer test-gemini-key");
    const body = JSON.parse(String(request.body));
    expect(body.model).toBe("gemini-3.1-flash-lite");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages).toEqual([
      { role: "system", content: "Return JSON with insights" },
      { role: "user", content: "Synthetic source" },
    ]);
  });

  it("maps free-tier rate limits without suggesting paid OpenAI credits", () => {
    const failure = classifyAiProviderError({ status: 429, code: "RESOURCE_EXHAUSTED" });
    expect(failure).toMatchObject({ status: 503, code: "ai_provider_rate_limited", refundReservation: true });
    expect(failure.message).not.toContain("OpenAI");
  });
});
