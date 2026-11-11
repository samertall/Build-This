import { afterEach, describe, expect, it, vi } from "vitest";
import proxy from "../artifacts/ux-workflow/middleware.js";

afterEach(() => vi.unstubAllEnvs());

describe("Preview API routing", () => {
  const request = new Request("https://preview-frontend.vercel.app/api/projects?status=active");

  it("preserves the production site's existing API proxy", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(proxy(request).headers.get("x-middleware-next")).toBe("1");
  });

  it("forwards Preview API traffic to the isolated backend", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_API_ORIGIN", "https://staging-api.vercel.app");
    expect(proxy(request).headers.get("x-middleware-rewrite"))
      .toBe("https://staging-api.vercel.app/api/projects?status=active");
  });

  it("fails closed if Preview backend is unconfigured", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PREVIEW_API_ORIGIN", "");
    expect(proxy(request).status).toBe(503);
  });

  it("rejects insecure or non-Vercel upstreams", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    for (const origin of ["http://staging-api.vercel.app", "https://other.example.com", "https://staging-api.vercel.app/private/"]) {
      vi.stubEnv("PREVIEW_API_ORIGIN", origin);
      expect(proxy(request).status).toBe(503);
    }
  });

  it("never falls through to production if the environment is unknown", () => {
    vi.stubEnv("VERCEL_ENV", "");
    expect(proxy(request).status).toBe(503);
  });
});
