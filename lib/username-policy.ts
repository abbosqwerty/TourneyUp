const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'api',
  'moderator',
  'official',
  'root',
  'staff',
  'support',
  'system',
  'tourneyup',
  'undefined',
])

const BLOCKED_WORDS = new Set([
  'bitch',
  'blyat',
  'cunt',
  'eblan',
  'faggot',
  'fuck',
  'fuckyou',
  'huy',
  'nigga',
  'nigger',
  'pidar',
  'pidor',
  'pussy',
  'shit',
  'suka',
  'whore',
  'zalupa',
])

function normalizeForModeration(username: string) {
  return username
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
}

export function isForbiddenUsername(username: string) {
  const normalized = normalizeForModeration(username)
  const parts = normalized.split('_').filter(Boolean)
  const compact = parts.join('')

  return (
    RESERVED_USERNAMES.has(normalized) ||
    parts.some((part) => RESERVED_USERNAMES.has(part)) ||
    BLOCKED_WORDS.has(compact) ||
    parts.some((part) => BLOCKED_WORDS.has(part))
  )
}
