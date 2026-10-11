/**
 * Typed confirmation words ("O‘CHIRISH", "УДАЛИТЬ", "DELETE"): case-insensitive,
 * and any apostrophe counts — most keyboards can't type the Uzbek ‘ directly.
 */
export function matchesConfirmWord(input: string, word: string): boolean {
  const normalize = (value: string) => value.trim().replace(/['‘’ʻʼ`]/g, '’').toLocaleUpperCase()
  return normalize(input) === normalize(word)
}
