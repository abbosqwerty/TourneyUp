import type { NotificationType } from '@prisma/client'
import { db } from './db'
import { encodeNotification, type NotificationKey, type NotificationParams } from './stored-text'

export { encodeNotification as notificationText }

export type NotificationView = {
  id: string
  type: NotificationType
  title: string
  body: string
  link: string | null
  read: boolean
  createdAt: string
}

export const NOTIFICATION_PAGE_SIZE = 12

/**
 * Fire-and-forget write. A notification is a courtesy, never the point of
 * the request — so a failure here must not fail the action that triggered it.
 */
export async function notify(input: {
  userId: string
  type: NotificationType
  title: string
  body: string
  link?: string | null
}): Promise<void> {
  try {
    await db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link ?? null,
      },
    })
  } catch (error) {
    console.error('notify failed', error)
  }
}

/** Same, for many recipients at once (e.g. every approved participant). */
export async function notifyMany(
  userIds: string[],
  payload: { type: NotificationType; title: string; body: string; link?: string | null }
): Promise<void> {
  const unique = [...new Set(userIds)]
  if (unique.length === 0) return

  try {
    await db.notification.createMany({
      data: unique.map((userId) => ({
        userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        link: payload.link ?? null,
      })),
    })
  } catch (error) {
    console.error('notifyMany failed', error)
  }
}

/**
 * Preferred form: the text is stored as a template key + params and rendered
 * in each reader's language (see `lib/stored-text.ts`). The plain-text
 * `notify`/`notifyMany` above still work and show their text as written.
 */
export async function notifyKey<K extends NotificationKey>(input: {
  userId: string
  type: NotificationType
  key: K
  params: NotificationParams<K>
  link?: string | null
}): Promise<void> {
  await notify({ userId: input.userId, type: input.type, link: input.link, ...encodeNotification(input.key, input.params) })
}

export async function notifyManyKey<K extends NotificationKey>(
  userIds: string[],
  payload: { type: NotificationType; key: K; params: NotificationParams<K>; link?: string | null }
): Promise<void> {
  await notifyMany(userIds, { type: payload.type, link: payload.link, ...encodeNotification(payload.key, payload.params) })
}

/** Rows as stored; render title/body with `renderNotification` from `lib/stored-text`. */
export async function listNotifications(userId: string, limit = NOTIFICATION_PAGE_SIZE) {
  const rows = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return rows.map(
    (row): NotificationView => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      link: row.link,
      read: row.readAt !== null,
      createdAt: row.createdAt.toISOString(),
    })
  )
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  try {
    return await db.notification.count({ where: { userId, readAt: null } })
  } catch (error) {
    console.error('countUnreadNotifications failed', error)
    return 0
  }
}
