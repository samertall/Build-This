export type SlideContent = Record<string, unknown>;

export function orderedContentEntries(
  content: SlideContent,
  sectionOrder?: string[],
): Array<[string, unknown]> {
  const entries = Object.entries(content);
  const values = new Map(entries);
  const seen = new Set<string>();
  const orderedKeys: string[] = [];

  if (Array.isArray(sectionOrder)) {
    for (const key of sectionOrder) {
      if (typeof key === "string" && values.has(key) && !seen.has(key)) {
        orderedKeys.push(key);
        seen.add(key);
      }
    }
  }

  // Older records do not have sectionOrder. Sort their remaining keys so
  // their preview stays stable after PostgreSQL has normalized the JSONB.
  for (const [key] of entries
    .map(([entryKey]) => [entryKey] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
    if (!seen.has(key)) {
      orderedKeys.push(key);
      seen.add(key);
    }
  }

  return orderedKeys.map((key) => [key, values.get(key)]);
}