'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { getChannelAccess } from './channels'
import { channelPostSchema, fieldErrors } from './schemas'
import { fail, type ActionResult } from './action-result'
import { minutes, rateLimit } from './rate-limit'
import { notifyMany } from './notifications'

/**
 * Write to a channel. Access comes from `getChannelAccess` — the client's
 * idea of what it may do is never trusted. `announce` is honoured only for
 * the organizer side; everyone else's post is an ordinary message.
 */
export async function postToChannel(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = channelPostSchema.safeParse(input)
  if (!parsed.success) return fail('Xabarda xatolik', fieldErrors(parsed.error))

  const { channelId, content, mediaId, announce } = parsed.data

  const limit = rateLimit(`channel-post:${user.id}`, 30, minutes(1))
  if (!limit.ok) return fail('Juda tez yozyapsiz — bir daqiqadan keyin urinib ko‘ring')

  try {
    const access = await getChannelAccess(channelId, user.id)
    if (!access.canPost) return fail('Bu kanalga yozish huquqingiz yo‘q')

    const channel = await db.channel.findUniqueOrThrow({ where: { id: channelId }, select: { type: true, title: true } })
    // Organization channels are announcement-only by nature.
    const kind = access.canAnnounce && (announce || channel.type === 'ORGANIZATION') ? 'ANNOUNCEMENT' : 'MESSAGE'

    await db.channelPost.create({
      data: { channelId, authorId: user.id, content, mediaId: mediaId || null, kind },
    })

    // Announcements also land in the notification bell.
    if (kind === 'ANNOUNCEMENT') {
      const members = await db.channelMember.findMany({
        where: { channelId, userId: { not: user.id } },
        select: { userId: true },
        take: 2000,
      })
      await notifyMany(
        members.map((m) => m.userId),
        {
          type: 'CHANNEL_POST',
          title: `E’lon: ${channel.title}`,
          body: content.slice(0, 140),
          link: `/messages/${channelId}`,
        }
      )
    }

    revalidatePath('/messages', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('postToChannel failed', error)
    return fail('Xabar yuborishda xatolik')
  }
}

export async function deleteChannelPost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const post = await db.channelPost.findUnique({
      where: { id: postId },
      select: { id: true, channelId: true, authorId: true, kind: true },
    })
    if (!post) return fail('Xabar topilmadi')

    const access = await getChannelAccess(post.channelId, user.id)
    const isAuthor = post.authorId === user.id && access.canRead
    if (!isAuthor && !access.canModerate) return fail('Bu xabarni o‘chirish huquqingiz yo‘q')
    if (post.kind === 'SYSTEM' && !access.canModerate) return fail('Tizim xabarini o‘chirib bo‘lmaydi')

    await db.channelPost.delete({ where: { id: postId } })
    revalidatePath('/messages', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('deleteChannelPost failed', error)
    return fail('O‘chirishda xatolik')
  }
}

export async function togglePinPost(postId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const post = await db.channelPost.findUnique({
      where: { id: postId },
      select: { id: true, channelId: true, pinned: true },
    })
    if (!post) return fail('Xabar topilmadi')

    const access = await getChannelAccess(post.channelId, user.id)
    if (!access.canAnnounce) return fail('Huquqingiz yo‘q')

    await db.channelPost.update({ where: { id: postId }, data: { pinned: !post.pinned } })
    revalidatePath(`/messages/${post.channelId}`)
    return { ok: true }
  } catch (error) {
    console.error('togglePinPost failed', error)
    return fail('Pin qilishda xatolik')
  }
}

/**
 * Follow an organization's announcement channel. Tournament and team groups
 * cannot be joined by hand — membership there follows registration and
 * team rosters.
 */
export async function subscribeToChannel(channelId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const channel = await db.channel.findUnique({ where: { id: channelId }, select: { type: true, archived: true } })
    if (!channel) return fail('Kanal topilmadi')
    if (channel.type !== 'ORGANIZATION') return fail('Bu guruhga faqat ishtirokchilar avtomatik qo‘shiladi')

    await db.channelMember.upsert({
      where: { channelId_userId: { channelId, userId: user.id } },
      update: {},
      create: { channelId, userId: user.id, role: 'SUBSCRIBER' },
    })

    revalidatePath('/messages', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('subscribeToChannel failed', error)
    return fail('Obuna bo‘lishda xatolik')
  }
}

export async function unsubscribeFromChannel(channelId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const membership = await db.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: user.id } },
      select: { id: true, role: true, channel: { select: { type: true } } },
    })
    if (!membership) return { ok: true }
    if (membership.channel.type !== 'ORGANIZATION') return fail('Bu guruhdan chiqish turnir yoki jamoa orqali bo‘ladi')
    if (membership.role === 'OWNER') return fail('Kanal egasi obunani bekor qila olmaydi')

    await db.channelMember.delete({ where: { id: membership.id } })
    revalidatePath('/messages', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('unsubscribeFromChannel failed', error)
    return fail('Obunani bekor qilishda xatolik')
  }
}

export async function markChannelRead(channelId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return { ok: true }

  try {
    await db.channelMember.updateMany({
      where: { channelId, userId: user.id },
      data: { lastReadAt: new Date() },
    })
    return { ok: true }
  } catch {
    return { ok: true }
  }
}
