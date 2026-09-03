---
name: Clerk email invitation matching
description: Reliable identity matching for project invitations addressed to an email.
---

Email-based invitations must resolve the authenticated user’s verified primary email through Clerk’s server-side user API when no explicitly configured trusted email claim is present.

**Why:** Standard Clerk session claims do not reliably include an email address, so authorizing invitations from a presumed `email` claim can silently deny valid invitees.

**How to apply:** When activating an email invitation, authenticate by Clerk user ID first, fetch the primary email server-side, normalize it, then bind the invitation to the immutable user ID for later requests.