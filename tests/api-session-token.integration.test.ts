import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, customFetch, setAuthTokenGetter } from "../lib/api-client-react/src/custom-fetch";

afterEach(() => {
  setAuthTokenGetter(null);
  vi.unstubAllGlobals();
});

describe("Clerk API bearer token forwarding", () => {
  it("sends a signed-in session token with JSON create requests", async () => {
    const getToken = vi.fn().mockResolvedValue("test-session-jwt");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 42 }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetcher);
    setAuthTokenGetter(getToken);

    const result = await customFetch<{ id: number }>("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "QA Test" }),
    });

    expect(result.id).toBe(42);
    expect(getToken).toHaveBeenCalledOnce();
    const headers = fetcher.mock.calls[0][1].headers as Headers;
    expect(headers.get("authorization")).toBe("Bearer test-session-jwt");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("does not attach stale tokens after sign-out", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetcher);
    setAuthTokenGetter(async () => "old-token");
    setAuthTokenGetter(null);

    await customFetch("/api/projects");
    const headers = fetcher.mock.calls[0][1].headers as Headers;
    expect(headers.has("authorization")).toBe(false);
  });

  it("preserves HTTP 401 so UI can show an actionable session error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"error":"Unauthorized"}', {
      status: 401,
      statusText: "Unauthorized",
      headers: { "Content-Type": "application/json" },
    })));
    await expect(customFetch("/api/projects")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
    } satisfies Partial<ApiError>);
  });
});
