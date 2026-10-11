'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { fail, type ActionResult } from './action-result'
import { listNotifications, type NotificationView } from './notifications'
import { guard, minutes } from './rate-limit'
import { getI18n } from './i18n/server'

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const { dict } = await getI18n()
  const e = dict.notify.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  try {
    // Scoped by `userId`, so a forged id cannot touch someone else's row.
    const result = await db.notification.updateMany({
      where: { id: notificationId, userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    if (result.count === 0) return { ok: true }

    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('markNotificationRead failed', error)
    return fail(e.mark_failed)
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const { dict, locale } = await getI18n()
  const e = dict.notify.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const limited = guard(`notif-read-all:${user.id}`, 30, minutes(10), locale)
  if (limited) return limited

  try {
    await db.notification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: new Date() },
    })
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('markAllNotificationsRead failed', error)
    return fail(e.mark_all_failed)
  }
}

/** Used by the bell dropdown to fetch the list only when it is opened. */
export async function fetchNotifications(): Promise<ActionResult<NotificationView[]>> {
  const { dict } = await getI18n()
  const e = dict.notify.errors
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  try {
    return { ok: true, data: await listNotifications(user.id) }
  } catch (error) {
    console.error('fetchNotifications failed', error)
    return fail(e.load_failed)
  }
}
