---
name: Playwright on Replit Nix
description: Environment requirements for repeatable Playwright validation in this workspace.
---

Playwright's package install does not guarantee that its browser binary exists in a fresh Replit environment. Keep browser installation in the repeatable validation command, and treat `libgbm` as a separate Chromium runtime dependency rather than assuming Mesa exposes it.

**Why:** Chromium launch first failed on missing GLib and then still failed on `libgbm.so.1` after the broader GTK/Mesa runtime set was present.

**How to apply:** When adding or changing Playwright release checks, preserve both the explicit browser-install step and the Nix Chromium runtime packages.