import { OpenAI } from "openai";

/** Google's documented OpenAI-compatible Gemini API endpoint. */
export const GEMINI_OPENAI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";
export type AiProvider = "gemini" | "openai";

export class AiProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiProviderConfigurationError";
  }
}

/**
 * Gemini is the migration default. OpenAI is available only when an
 * administrator explicitly selects AI_PROVIDER=openai. Never silently fall
 * back to an account with paid billing.
 */
export function selectedAiProvider(env: NodeJS.ProcessEnv = process.env): AiProvider {
  const requested = env.AI_PROVIDER?.trim().toLowerCase() || "gemini";
  if (requested !== "gemini" && requested !== "openai") {
    throw new AiProviderConfigurationError("Unsupported AI_PROVIDER. Use gemini or openai.");
  }
  return requested;
}

export type AiProviderSettings = {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
};

export function resolveAiProviderSettings(env: NodeJS.ProcessEnv = process.env): AiProviderSettings {
  const provider = selectedAiProvider(env);
  if (provider === "gemini") {
    const apiKey = env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new AiProviderConfigurationError("Gemini API key is not configured. Add GEMINI_API_KEY to the api-server Vercel Production environment.");
    }
    return {
      provider,
      apiKey,
      model: env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
      baseURL: GEMINI_OPENAI_BASE_URL,
    };
  }

  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new AiProviderConfigurationError("OpenAI API key is not configured.");
  }
  return {
    provider,
    apiKey,
    model: env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
  };
}

/** Share the existing JSON-mode prompts across both providers. */
export async function requestAiJson(
  systemPrompt: string,
  userPrompt: string,
  options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {},
): Promise<string> {
  const settings = resolveAiProviderSettings(options.env);
  const client = new OpenAI({
    apiKey: settings.apiKey,
    ...(settings.baseURL ? { baseURL: settings.baseURL } : {}),
    ...(options.fetcher ? { fetch: options.fetcher } : {}),
    maxRetries: 0, // Do not silently burn scarce free-tier RPM and quota.
    timeout: 40_000,
  });

  const response = await client.chat.completions.create({
    model: settings.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4000,
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content ?? "{}";
}
