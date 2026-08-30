---
name: Same-origin API and reproducible builds
description: Security and validation conventions for this app's proxied web/API artifacts.
---

The web app and API are served through the same proxied origin, so the API should not reflect arbitrary credentialed CORS origins. Keep cross-origin access disabled unless a real separate client requires an explicitly allowlisted origin.

**Why:** Reflecting every origin while enabling credentials unnecessarily broadens the browser trust boundary. Requiring workflow-only PORT or BASE_PATH variables also makes a valid static production build fail when run directly.

**How to apply:** Preserve explicit Replit service variables when present, but provide safe build-time defaults for static Vite builds. Test health and protected API routes locally, then restart managed workflows after runtime/config changes.