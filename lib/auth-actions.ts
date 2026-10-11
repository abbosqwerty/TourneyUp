'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { db } from './db'
import { hashPassword, verifyPassword } from './password'
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from './session'
import {
  changePasswordSchema,
  deleteAccountSchema,
  fieldErrors,
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { clientIp, guard, minutes, rateLimit } from './rate-limit'
import { mediaUrl } from './media'

/** Where a role should land after signing in. */
function landingFor(role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN') {
  if (role === 'SUPER_ADMIN') return '/admin'
  if (role === 'ORGANIZATION') return '/dashboard'
  return '/feed'
}

async function userAgent() {
  try {
    return (await headers()).get('user-agent')
  } catch {
    return null
  }
}

export async function registerUser(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return fail('Formada xatolar bor', fieldErrors(parsed.error))
  }

  const ip = await clientIp()
  const limit = rateLimit(`register:${ip}`, 5, minutes(30))
  if (!limit.ok) {
    return fail('Juda ko‘p urinish. 30 daqiqadan keyin qayta urinib ko‘ring.')
  }

  const { name, username, email, password, university, location } = parsed.data

  try {
    const clash = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    })
    if (clash) {
      return fail(
        'Bu akkaunt allaqachon mavjud',
        clash.username === username
          ? { username: 'Bu username band' }
          : { email: 'Bu email allaqachon ro‘yxatdan o‘tgan' }
      )
    }

    const user = await db.user.create({
      data: {
        name,
        username,
        email,
        passwordHash: await hashPassword(password),
        // Self-registration always produces a plain player account.
        role: 'USER',
        bio: '',
        university: university || null,
        location: location || '',
        joinedDate: new Date().toISOString().slice(0, 10),
      },
      select: { id: true, role: true },
    })

    await createSession(user.id, await userAgent())
    revalidatePath('/', 'layout')
    return succeedWith({ redirectTo: landingFor(user.role) })
  } catch (error) {
    console.error('registerUser failed', error)
    return fail('Ro‘yxatdan o‘tishda xatolik yuz berdi. Keyinroq urinib ko‘ring.')
  }
}

export async function loginWithPassword(input: unknown): Promise<ActionResult<{ redirectTo: string; mustChangePassword: boolean }>> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return fail('Formada xatolar bor', fieldErrors(parsed.error))
  }

  const { identifier, password } = parsed.data
  const ip = await clientIp()

  // Two counters: one per IP, one per account, so a shared NAT does not
  // lock everyone out and a single account cannot be sprayed from many IPs.
  for (const key of [`login:ip:${ip}`, `login:id:${identifier.toLowerCase()}`]) {
    const limit = rateLimit(key, 8, minutes(15))
    if (!limit.ok) {
      return fail('Juda ko‘p urinish. 15 daqiqadan keyin qayta urinib ko‘ring.')
    }
  }

  try {
    const lookup = identifier.toLowerCase().trim()
    const lookupAlt = lookup.endsWith('@gail.com')
      ? lookup.replace('@gail.com', '@gmail.com')
      : lookup.endsWith('@gmail.com')
        ? lookup.replace('@gmail.com', '@gail.com')
        : lookup

    const user = await db.user.findFirst({
      where: { OR: [{ email: lookup }, { email: lookupAlt }, { username: lookup }] },
      select: { id: true, role: true, passwordHash: true, mustChangePassword: true },
    })

    const valid = await verifyPassword(password, user?.passwordHash)
    if (!user || !valid) {
      return fail('Email/username yoki parol noto‘g‘ri')
    }

    await createSession(user.id, await userAgent())
    revalidatePath('/', 'layout')

    return succeedWith({
      redirectTo: user.mustChangePassword ? '/settings/password' : landingFor(user.role),
      mustChangePassword: user.mustChangePassword,
    })
  } catch (error) {
    console.error('loginWithPassword failed', error)
    return fail('Tizimga kirishda xatolik. Keyinroq urinib ko‘ring.')
  }
}

export async function logout(): Promise<ActionResult> {
  await destroySession()
  revalidatePath('/', 'layout')
  return { ok: true }
}

/**
 * Edit your own profile. `role`, `verified`, `globalRank` and `totalPoints`
 * are deliberately not writable here — those are set by the platform.
 */
export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const limited = guard(`update-profile:${user.id}`, 20, minutes(10))
  if (limited) return limited

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) return fail('Formada xatolar bor', fieldErrors(parsed.error))

  const { name, username, bio, university, location, avatarMediaId } = parsed.data

  try {
    if (username !== user.username) {
      const taken = await db.user.findUnique({ where: { username }, select: { id: true } })
      if (taken) return fail('Bu username band', { username: 'Bu username band' })
    }

    // An avatar may only point at an asset this account uploaded.
    let avatar: string | undefined
    if (avatarMediaId) {
      const asset = await db.mediaAsset.findFirst({
        where: { id: avatarMediaId, uploadedById: user.id },
        select: { id: true },
      })
      if (!asset) return fail('Rasm topilmadi — qaytadan yuklang')
      avatar = mediaUrl(asset.id) ?? undefined
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        bio: bio ?? '',
        university: university || null,
        location: location ?? '',
        ...(avatar ? { avatar } : {}),
      },
    })

    revalidatePath('/', 'layout')
    revalidatePath('/profile')
    revalidatePath('/settings')
    return { ok: true }
  } catch (error) {
    console.error('updateProfile failed', error)
    return fail('Profilni saqlashda xatolik')
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return fail('Formada xatolar bor', fieldErrors(parsed.error))
  }

  try {
    const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    if (!(await verifyPassword(parsed.data.currentPassword, record?.passwordHash))) {
      return fail('Hozirgi parol noto‘g‘ri', { currentPassword: 'Parol noto‘g‘ri' })
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(parsed.data.newPassword),
        mustChangePassword: false,
      },
    })

    // Drop every other session, then re-issue one for this browser.
    await destroyAllSessions(user.id)
    await createSession(user.id, await userAgent())
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('changePassword failed', error)
    return fail('Parolni almashtirishda xatolik')
  }
}

/**
 * Permanent account deletion. Every relation either cascades or is set to
 * null in `schema.prisma`, so no orphan rows are left behind.
 *
 * Organization and admin accounts are excluded on purpose: deleting an owner
 * cascades its tournaments, which is a platform decision, not a self-service
 * one. Those go through a SUPER_ADMIN.
 */
export async function deleteAccount(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser()
  if (!user) return fail('Avval tizimga kiring')

  if (user.role !== 'USER') {
    return fail('Tashkilot va admin akkauntlarini o‘zi o‘chira olmaydi — administratorga murojaat qiling')
  }

  const limited = guard(`delete-account:${user.id}`, 5, minutes(60))
  if (limited) return limited

  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) return fail('Tasdiqlashda xatolik', fieldErrors(parsed.error))

  try {
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })
    if (!(await verifyPassword(parsed.data.password, record?.passwordHash))) {
      return fail('Parol noto‘g‘ri', { password: 'Parol noto‘g‘ri' })
    }

    await db.user.delete({ where: { id: user.id } })
    await destroySession()
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('deleteAccount failed', error)
    return fail('Akkauntni o‘chirishda xatolik')
  }
}
