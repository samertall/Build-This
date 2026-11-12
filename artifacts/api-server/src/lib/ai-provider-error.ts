/** Safe, client-facing mapping for AI provider failures; never expose API keys or SDK details. */
export type AiProviderFailure = {
  status: number;
  code: string;
  message: string;
  refundReservation: boolean;
  retryAfter?: number;
};

export function classifyAiProviderError(error: unknown): AiProviderFailure {
  const object = error !== null && typeof error === "object"
    ? error as { status?: unknown; code?: unknown; error?: { code?: unknown }; message?: unknown }
    : undefined;
  const code = typeof object?.code === "string"
    ? object.code
    : typeof object?.error?.code === "string"
      ? object.error.code
      : "";
  const status = typeof object?.status === "number" ? object.status : undefined;

  if (code === "credit_balance_exhausted") {
    return {
      status: 503,
      code: "ai_credits_exhausted",
      message: "OpenAI API credits are exhausted. The application owner must add API credits in the OpenAI Platform billing settings before running AI analysis.",
      refundReservation: true,
    };
  }

  if (["organization_usage_limit_exceeded", "organization_spend_limit_exceeded", "project_spend_limit_exceeded", "insufficient_quota"].includes(code)) {
    return {
      status: 503,
      code: "ai_provider_usage_limit",
      message: "The AI provider's usage or spending limit has been reached. Check the OpenAI API organization and project limits.",
      refundReservation: true,
    };
  }

  if (status === 429) {
    return {
      status: 503,
      code: "ai_provider_rate_limited",
      message: "The AI provider is temporarily rate limiting requests. Try again shortly.",
      refundReservation: true,
      retryAfter: 60,
    };
  }

  if (status === 401 || status === 403 || object?.message === "OPENAI_API_KEY is not configured") {
    return {
      status: 503,
      code: "ai_provider_not_configured",
      message: "The AI provider cannot be authenticated. Contact the application administrator.",
      refundReservation: true,
    };
  }

  return {
    status: 500,
    code: "ai_analysis_failed",
    message: "Analysis failed. Please retry or contact support if the problem continues.",
    refundReservation: false,
  };
}
