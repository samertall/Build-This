import { next, rewrite } from "@vercel/functions";

export const config = {
  matcher: ["/api/:path*"],
};

const PREVIEW_ENDPOINT_ERROR = JSON.stringify({
  error: "Preview API is not configured for an isolated staging deployment",
});

function previewUnavailable() {
  return new Response(PREVIEW_ENDPOINT_ERROR, {
    status: 503,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Keep Preview requests away from the production API.
 *
 * Vercel's production API alias is hardcoded in vercel.json for the live site.
 * Routing Middleware intercepts /api requests on Preview first and routes them
 * to the explicitly configured Preview API branch. Missing or unsafe config
 * fails closed instead of falling through to the production rewrite.
 */
export default function middleware(request) {
  if (process.env.VERCEL_ENV === "production") return next();

  if (process.env.VERCEL_ENV !== "preview") return previewUnavailable();

  const rawOrigin = process.env.PREVIEW_API_ORIGIN;
  if (!rawOrigin) return previewUnavailable();

  let origin;
  try {
    origin = new URL(rawOrigin);
  } catch {
    return previewUnavailable();
  }

  if (
    origin.protocol !== "https:" ||
    !origin.hostname.endsWith(".vercel.app") ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  ) {
    return previewUnavailable();
  }

  const incoming = new URL(request.url);
  return rewrite(new URL(`${incoming.pathname}${incoming.search}`, origin));
}
