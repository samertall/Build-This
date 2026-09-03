---
name: Authenticated browser test modes
description: How to keep authenticated browser release checks local and deterministic without leaving Clerk-dependent UI paths incomplete.
---

An authenticated browser test mode must provide identity at both boundaries: the API authorization middleware and every frontend shell that normally consumes Clerk context.

**Why:** Bypassing protected route guards is insufficient when shared layouts still call Clerk hooks; the page mounts and then fails before the tested workflow renders.

**How to apply:** Gate test identity behind explicit server and Vite test-mode variables, keep production Clerk wiring unchanged, and have the test shell supply only the display identity needed by shared UI.