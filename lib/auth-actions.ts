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
import { getI18n } from './i18n/server'

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
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) {
    return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  }

  const ip = await clientIp()
  const limit = rateLimit(`register:${ip}`, 5, minutes(30))
  if (!limit.ok) {
    return fail(dict.errors.rate_limited(30))
  }

  const { name, username, email, password, university, location } = parsed.data

  try {
    const clash = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true, email: true },
    })
    if (clash) {
      return fail(
        t.account_exists,
        clash.username === username
          ? { username: t.username_taken }
          : { email: t.email_registered }
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
    return fail(t.register_failed)
  }
}

export async function loginWithPassword(input: unknown): Promise<ActionResult<{ redirectTo: string; mustChangePassword: boolean }>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  }

  const { identifier, password } = parsed.data
  const ip = await clientIp()

  // Two counters: one per IP, one per account, so a shared NAT does not
  // lock everyone out and a single account cannot be sprayed from many IPs.
  for (const key of [`login:ip:${ip}`, `login:id:${identifier.toLowerCase()}`]) {
    const limit = rateLimit(key, 8, minutes(15))
    if (!limit.ok) {
      return fail(dict.errors.rate_limited(15))
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
      return fail(t.invalid_credentials)
    }

    await createSession(user.id, await userAgent())
    revalidatePath('/', 'layout')

    return succeedWith({
      redirectTo: user.mustChangePassword ? '/settings/password' : landingFor(user.role),
      mustChangePassword: user.mustChangePassword,
    })
  } catch (error) {
    console.error('loginWithPassword failed', error)
    return fail(t.login_failed)
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
  const { dict, locale } = await getI18n()
  const t = dict.account.actions
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const limited = guard(`update-profile:${user.id}`, 20, minutes(10), locale)
  if (limited) return limited

  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { name, username, bio, university, location, avatarMediaId } = parsed.data

  try {
    if (username !== user.username) {
      const taken = await db.user.findUnique({ where: { username }, select: { id: true } })
      if (taken) return fail(t.username_taken, { username: t.username_taken })
    }

    // An avatar may only point at an asset this account uploaded.
    let avatar: string | undefined
    if (avatarMediaId) {
      const asset = await db.mediaAsset.findFirst({
        where: { id: avatarMediaId, uploadedById: user.id },
        select: { id: true },
      })
      if (!asset) return fail(t.image_not_found)
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
    return fail(t.profile_save_failed)
  }
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  const parsed = changePasswordSchema.safeParse(input)
  if (!parsed.success) {
    return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  }

  try {
    const record = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    if (!(await verifyPassword(parsed.data.currentPassword, record?.passwordHash))) {
      return fail(t.current_password_wrong, { currentPassword: t.password_wrong })
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
    return fail(t.password_change_failed)
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
  const { dict, locale } = await getI18n()
  const t = dict.account.actions
  const user = await getCurrentUser()
  if (!user) return fail(dict.errors.login_required)

  if (user.role !== 'USER') {
    return fail(t.org_cannot_delete)
  }

  const limited = guard(`delete-account:${user.id}`, 5, minutes(60), locale)
  if (limited) return limited

  const parsed = deleteAccountSchema.safeParse(input)
  if (!parsed.success) return fail(t.confirm_failed, fieldErrors(parsed.error, dict))

  try {
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    })
    if (!(await verifyPassword(parsed.data.password, record?.passwordHash))) {
      return fail(t.password_wrong, { password: t.password_wrong })
    }

    await db.user.delete({ where: { id: user.id } })
    await destroySession()
    revalidatePath('/', 'layout')
    return { ok: true }
  } catch (error) {
    console.error('deleteAccount failed', error)
    return fail(t.delete_failed)
  }
}
