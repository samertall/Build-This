/** Never pass off demonstration data as real AI output in production. */
export function testMockFallbackEnabled(): boolean {
  return process.env.NODE_ENV === "test" && process.env.ALLOW_AI_MOCK_FALLBACK === "true";
}

export function handleAgentFailure<T>(error: unknown, sample: () => T): T {
  if (testMockFallbackEnabled()) return sample();
  throw error;
}

export function parseAgentItems<T>(raw: string, field: string): T[] {
  const parsed: unknown = JSON.parse(raw);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray((parsed as Record<string, unknown>)[field]) ||
    (parsed as Record<string, unknown[]>)[field].length === 0
  ) {
    throw new Error(`AI agent returned an invalid or empty ${field} result`);
  }
  return (parsed as Record<string, T[]>)[field];
}
