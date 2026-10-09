/**
 * Rules and requirements are stored as JSON strings. A hand-edited row or a
 * legacy empty string must not take a whole page down with a parse throw.
 */
export function safeParseJsonArray(value: string | null | undefined): string[] {
  if (!value) return []

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string')
  } catch {
    return []
  }
}
