---
name: Design subagent full-app redesign
description: How to structure a "redesign the whole app" request across many pages using design subagents
---

When asked to redesign/improve UI+UX across an entire multi-page app, a single DESIGN subagent tends to only update foundational files (theme CSS variables, App.tsx, shared layout) and leaves individual page files with their old hardcoded colors untouched — because it treats the foundation as "done" without propagating to every page.

**Why:** Pages that use hardcoded Tailwind color utilities (e.g. `bg-slate-950`, `text-cyan-400`) instead of semantic tokens (`bg-background`, `text-primary`) do not inherit changes to CSS theme variables. A subagent that "sets up the theme" is not the same as one that "applies the theme everywhere."

**How to apply:** For a full-app redesign, do it in two phases:
1. One subagent pass to establish the foundation (theme CSS vars, fonts, App.tsx, shared layout/sidebar).
2. Split the remaining pages into a few parallel batches (e.g. by pipeline/section) and launch separate DESIGN subagents per batch, explicitly instructing them to remove old hardcoded color classes and replace with the new semantic tokens — do not assume they'll infer this without being told the new tokens exist and old ones must go.

After all batches complete, grep for the old hardcoded color patterns (e.g. `grep -rlE "(bg|text|border)-(oldcolor)-[0-9]+"`) across all page files to confirm no leftovers, and run typecheck — mutation hook param name mismatches (e.g. `projectId` vs `id`) are a common latent bug that surfaces only once you finally run a typecheck after page edits.
