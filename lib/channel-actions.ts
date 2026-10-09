'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { getChannelAccess } from './channels'
import { channelPostSchema, fieldErrors } from './schemas'
import { fail, type ActionResult } from './action-result'
import { minutes, rateLimit } from './rate-limit'

/** Publish to a channel. Only owners and live staff get through. */
export async function postToChannel(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = channelPostSchema.safeParse(input)
  if (!parsed.success) return fail('Xabarda xatolik', fieldErrors(parsed.error))

  const { channelId, content, mediaId } = parsed.data

  const limit = rateLimit(`channel-post:${user.id}`, 30, minutes(1))
  if (!limit.ok) return fail('Juda tez yozyapsiz — bir daqiqadan keyin urinib ko‘ring')

  try {
    const access = await getChannelAccess(channelId, user.id)
    if (!access.canPost) return fail('Bu kanalga yozish huquqingiz yo‘q')

    await db.channelPost.create({
      data: { channelId, authorId: user.id, content, mediaId: mediaId || null },
    })

    revalidatePath('/messages')
    revalidatePath(`/messages/${channelId}`)
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
      select: { id: true, channelId: true, authorId: true },
    })
    if (!post) return fail('Xabar topilmadi')

    const access = await getChannelAccess(post.channelId, user.id)
    const isAuthor = post.authorId === user.id
    if (!isAuthor && access.memberRole !== 'OWNER' && user.role !== 'SUPER_ADMIN') {
      return fail('Bu xabarni o‘chirish huquqingiz yo‘q')
    }

    await db.channelPost.delete({ where: { id: postId } })
    revalidatePath('/messages')
    revalidatePath(`/messages/${post.channelId}`)
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
    if (!access.canPost) return fail('Huquqingiz yo‘q')

    await db.channelPost.update({ where: { id: postId }, data: { pinned: !post.pinned } })
    revalidatePath(`/messages/${post.channelId}`)
    return { ok: true }
  } catch (error) {
    console.error('togglePinPost failed', error)
    return fail('Pin qilishda xatolik')
  }
}

/** Subscribe to an organization or tournament channel. */
export async function subscribeToChannel(channelId: string): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  try {
    const channel = await db.channel.findUnique({ where: { id: channelId }, select: { id: true } })
    if (!channel) return fail('Kanal topilmadi')

    await db.channelMember.upsert({
      where: { channelId_userId: { channelId, userId: user.id } },
      update: {},
      create: { channelId, userId: user.id, role: 'SUBSCRIBER' },
    })

    revalidatePath('/messages')
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
      select: { id: true, role: true },
    })
    if (!membership) return { ok: true }
    if (membership.role === 'OWNER') return fail('Kanal egasi obunani bekor qila olmaydi')

    await db.channelMember.delete({ where: { id: membership.id } })
    revalidatePath('/messages')
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
    revalidatePath('/messages')
    return { ok: true }
  } catch {
    return { ok: true }
  }
}
