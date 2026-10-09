'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { fail, type ActionResult } from './action-result'
import { listNotifications, type NotificationView } from './notifications'
import { guard, minutes } from './rate-limit'

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

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
    return fail('Bildirishnomani belgilashda xatolik')
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const limited = guard(`notif-read-all:${user.id}`, 30, minutes(10))
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
    return fail('Bildirishnomalarni belgilashda xatolik')
  }
}

/** Used by the bell dropdown to fetch the list only when it is opened. */
export async function fetchNotifications(): Promise<ActionResult<NotificationView[]>> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    return { ok: true, data: await listNotifications(user.id) }
  } catch (error) {
    console.error('fetchNotifications failed', error)
    return fail('Bildirishnomalarni yuklab bo‘lmadi')
  }
}
