# Build-This AI provider: Google Gemini Free Tier

Build-This runs six sequential AI agents using the OpenAI-compatible Gemini API.
The app defaults to **Gemini**; it does **not** automatically fall back to a paid
OpenAI account, even if `OPENAI_API_KEY` remains stored in Vercel.

## Create a free-tier API key (administrator only)

1. Visit https://aistudio.google.com/api-keys and sign into your Google account.
2. Create or select a Google Cloud project; confirm it says **Free Tier** in AI Studio.
3. Create a new **authorization API key** for the Gemini API. Do not click Set up billing.
4. In https://vercel.com/samertalls-projects/api-server/settings/environment-variables
   create a **Sensitive** variable named `GEMINI_API_KEY`, paste the key there,
   and target **Production**. Also set a separate key for **Preview** only
   if needed for live staging tests. Never put this key in the frontend.
5. Set `AI_PROVIDER=gemini` (plain) and
   `GEMINI_MODEL=gemini-3.1-flash-lite` (plain) on the **backend**.
6. Redeploy **api-server** after adding/changing the secret; confirm the active
   deployment is READY. The frontend needs no Gemini key or rebuild.
7. In Build-This, add a **fictional** source note, dispatch **one** agent first,
   and inspect the generated record. Then run the other five stages.

## Environment variables

| Variable | Scope | Example |
| --- | --- | --- |
| `AI_PROVIDER` | Backend | `gemini` (default), or explicit `openai` |
| `GEMINI_API_KEY` | Backend secret | Value from Google AI Studio — **never commit** |
| `GEMINI_MODEL` | Backend | `gemini-3.1-flash-lite` |
| `OPENAI_API_KEY` | Backend secret | Only used when `AI_PROVIDER=openai` |
| `OPENAI_MODEL` | Backend | Only used for explicit OpenAI provider |

## Operating limits and privacy

- Gemini Free Tier has **rate limits per project** (RPM, tokens/minute, requests/day).
  Limits vary: https://aistudio.google.com/rate-limit
- Free Tier inputs and outputs **may be used to improve Google's products**.
  Do not upload private client research or sensitive personal data without
  separate review and appropriate contractual/privacy terms.
- The six agents issue up to six sequential model requests; starting with one
  agent avoids hitting free-tier request caps during initial validation.
- JSON mode is requested, but responses are still validated before persistence.
- No backend fallback to OpenAI. A missing key produces a safe 503 instruction
  rather than sending any traffic to OpenAI.
- Provider quota errors do not consume the app's daily AI stage allowance.
- Do not share a key in chat, issue comments, console screenshots, or source code.

Official docs:
- https://ai.google.dev/gemini-api/docs/openai
- https://ai.google.dev/gemini-api/docs/api-key
- https://ai.google.dev/gemini-api/docs/pricing
