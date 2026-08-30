---
name: Mounted web artifact routing
description: Preview environments can expose a root-configured web artifact under its slug path.
---

When a web artifact is configured at `/` but is also opened under its artifact slug path, the client router must recognize that mount prefix or it will render the app’s 404 page even though the server returns the SPA shell.

**Why:** The proxied preview can expose both the root URL and a slug-prefixed URL; the root-only Wouter base matched the former but not the latter.

**How to apply:** Keep root behavior intact, detect the known artifact mount at runtime, and use the resolved base for client routing and authentication navigation. Avoid remote decorative assets that can independently produce browser 404s.