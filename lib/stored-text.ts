import { dictionaries, type Dictionary } from './i18n/dictionaries'

/**
 * Site-generated text that is stored in the database (notifications and
 * channel SYSTEM posts) must follow the reader's language, not the language
 * it was written in. New rows therefore store a template key instead of
 * finished text:
 *
 *   Notification   title = "i18n:<key>"   body = JSON params
 *   SYSTEM post    content = "i18n:<key>"
 *
 * and are rendered with the reader's dictionary (`dict.notify.templates`,
 * `dict.notify.system`). Older rows hold plain Uzbek text and are shown as
 * stored. Client-safe: no Prisma, no server-only imports.
 */

export const STORED_TEXT_PREFIX = 'i18n:'

type Templates = Dictionary['notify']['templates']
export type NotificationKey = keyof Templates
type TemplateParams<T> = T extends {
  title: (p: infer A) => string
  body: (p: infer B) => string
}
  ? A & B
  : never
export type NotificationParams<K extends NotificationKey> = TemplateParams<Templates[K]>
export type SystemPostKey = keyof Dictionary['notify']['system']

/** What to store for a notification; spread into `notify`/`notifyMany`. */
export function encodeNotification<K extends NotificationKey>(key: K, params: NotificationParams<K>) {
  return { title: `${STORED_TEXT_PREFIX}${key}`, body: JSON.stringify(params) }
}

/** What to store as a SYSTEM post's content. */
export function encodeSystemPost(key: SystemPostKey) {
  return `${STORED_TEXT_PREFIX}${key}`
}

type AnyTemplate = { title: (p: Record<string, unknown>) => string; body: (p: Record<string, unknown>) => string }

/** Notification title/body in the reader's language. */
export function renderNotification(item: { title: string; body: string }, dict: Dictionary): { title: string; body: string } {
  if (!item.title.startsWith(STORED_TEXT_PREFIX)) return { title: item.title, body: item.body }

  const key = item.title.slice(STORED_TEXT_PREFIX.length)
  const template = (dict.notify.templates as unknown as Record<string, AnyTemplate | undefined>)[key]
  let params: Record<string, unknown> = {}
  try {
    const parsed: unknown = JSON.parse(item.body)
    if (parsed && typeof parsed === 'object') params = parsed as Record<string, unknown>
  } catch {
    // not JSON — fall through with no params
  }
  if (!template) return { title: key, body: '' }

  // Enum values travel raw and are labelled in the reader's language.
  if (typeof params.status === 'string') {
    params.status = (dict.status as Record<string, string>)[params.status] ?? params.status
  }
  if (key === 'staff_assigned' && typeof params.role === 'string') {
    params.role = (dict.chat.roles.staff as Record<string, string>)[params.role] ?? params.role
  }

  try {
    return { title: template.title(params), body: template.body(params) }
  } catch {
    return { title: key, body: '' }
  }
}

/** A SYSTEM post's content in the reader's language. */
export function renderSystemPost(content: string, dict: Dictionary): string {
  const system = dict.notify.system as Record<string, string>
  if (content.startsWith(STORED_TEXT_PREFIX)) {
    return system[content.slice(STORED_TEXT_PREFIX.length)] ?? content
  }
  // Rows written before keys existed: recognise the fixed Uzbek lines.
  const legacy = Object.entries(dictionaries.uz.notify.system).find(([, text]) => text === content)
  return legacy ? (system[legacy[0]] ?? content) : content
}
