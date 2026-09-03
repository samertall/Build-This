---
name: Preserve pnpm workspace policy
description: Avoid accidental policy and formatting changes when dependency commands rewrite pnpm-workspace.yaml.
---

After running pnpm dependency commands, compare `pnpm-workspace.yaml` against its prior contents and restore unrelated rewrites. Preserve the minimum-release-age policy, explanatory comments, catalog ranges, exact-version constraints, and platform overrides.

**Why:** The workspace pnpm version can normalize the YAML by reordering sections, removing comments, and changing version range formatting even when the requested dependency change does not require any catalog edit.

**How to apply:** After any `pnpm add` or similar dependency mutation, inspect this file separately and keep only intentional package-policy changes.