---
name: Presentation export validation
description: Stable validation rules for presentation files generated from JSONB-backed slide data.
---

Validate an export route’s declared content length against the binary body actually received, and separately check the document signature and headers. Do not assume regenerating from the original fixture will produce the same byte length as regenerating from the stored record.

**Why:** PostgreSQL JSONB can reorder nested object keys. The PDF renderer traverses those keys, so a semantically identical stored presentation can produce a valid PDF with a different byte length than the original in-memory fixture.

**How to apply:** For HTTP download regression tests, seed the database, request the real route as an authorized user, parse the response as raw bytes, compare `Content-Length` to the received buffer, and check the PPTX/PDF signature. Use a stored-record regeneration only when exact byte equivalence is required.