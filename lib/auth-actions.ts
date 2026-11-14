'use server'

import { randomInt } from 'crypto'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { db } from './db'
import { hashPassword, verifyPassword } from './password'
import { createSession, destroyAllSessions, destroySession, getCurrentUser } from './session'
import {
  changePasswordSchema,
  deleteAccountSchema,
  fieldErrors,
  googleRegisterSchema,
  loginSchema,
  passwordResetCompleteSchema,
  passwordResetRequestSchema,
  registerSchema,
  verifyRegistrationSchema,
  updateProfileSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { clientIp, guard, minutes, rateLimit } from './rate-limit'
import { mediaUrl } from './media'
import { getI18n } from './i18n/server'
import { matchesConfirmWord } from './confirm-word'
import { GOOGLE_REGISTRATION_COOKIE, readGoogleRegistration } from './google-registration'
import { sendPasswordResetCode, sendRegistrationCode } from './email'
import { PRIVACY_VERSION, TERMS_VERSION } from './legal'

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

export async function registerUser(input: unknown): Promise<ActionResult<{ email: string }>> {
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

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const acceptedAt = new Date()
    await db.emailRegistration.upsert({
      where: { email },
      create: {
        email,
        name,
        username,
        passwordHash: await hashPassword(password),
        university: university || null,
        location: location || '',
        codeHash: await hashPassword(code),
        expiresAt: new Date(Date.now() + minutes(10)),
        termsAcceptedAt: acceptedAt,
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: acceptedAt,
        privacyVersion: PRIVACY_VERSION,
      },
      update: {
        name,
        username,
        passwordHash: await hashPassword(password),
        university: university || null,
        location: location || '',
        codeHash: await hashPassword(code),
        attempts: 0,
        expiresAt: new Date(Date.now() + minutes(10)),
        lastSentAt: new Date(),
        termsAcceptedAt: acceptedAt,
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: acceptedAt,
        privacyVersion: PRIVACY_VERSION,
      },
    })

    try {
      await sendRegistrationCode(email, code)
    } catch {
      await db.emailRegistration.deleteMany({ where: { email } })
      return fail(t.verification_email_failed)
    }
    return succeedWith({ email })
  } catch (error) {
    console.error('registerUser failed', error)
    return fail(t.register_failed)
  }
}

export async function verifyRegistrationCode(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = verifyRegistrationSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const ip = await clientIp()
  const limit = rateLimit(`verify-registration:${ip}`, 15, minutes(15))
  if (!limit.ok) return fail(dict.errors.rate_limited(15))

  const pending = await db.emailRegistration.findUnique({ where: { email: parsed.data.email } })
  if (!pending || pending.expiresAt.getTime() < Date.now()) {
    if (pending) await db.emailRegistration.deleteMany({ where: { id: pending.id } })
    return fail(t.verification_code_expired)
  }
  if (pending.attempts >= 5) return fail(t.verification_too_many_attempts)

  const valid = await verifyPassword(parsed.data.code, pending.codeHash)
  if (!valid) {
    await db.emailRegistration.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } })
    return fail(t.verification_code_wrong, { code: t.verification_code_wrong })
  }

  try {
    const user = await db.$transaction(async (tx) => {
      const fresh = await tx.emailRegistration.findUnique({ where: { id: pending.id } })
      if (!fresh || fresh.expiresAt.getTime() < Date.now()) throw new Error('EXPIRED')
      if (fresh.termsVersion !== TERMS_VERSION || fresh.privacyVersion !== PRIVACY_VERSION) throw new Error('EXPIRED')
      const clash = await tx.user.findFirst({ where: { OR: [{ email: fresh.email }, { username: fresh.username }] } })
      if (clash) throw new Error('CLASH')
      const created = await tx.user.create({
        data: {
          name: fresh.name,
          username: fresh.username,
          email: fresh.email,
          passwordHash: fresh.passwordHash,
          role: 'USER',
          verified: true,
          bio: '',
          university: fresh.university,
          location: fresh.location,
          joinedDate: new Date().toISOString().slice(0, 10),
          termsAcceptedAt: fresh.termsAcceptedAt,
          termsVersion: fresh.termsVersion,
          privacyAcceptedAt: fresh.privacyAcceptedAt,
          privacyVersion: fresh.privacyVersion,
        },
        select: { id: true },
      })
      await tx.emailRegistration.delete({ where: { id: fresh.id } })
      return created
    })
    await createSession(user.id, await userAgent())
    revalidatePath('/', 'layout')
    return succeedWith({ redirectTo: '/feed' })
  } catch (error) {
    if (error instanceof Error && error.message === 'CLASH') return fail(t.account_exists)
    if (error instanceof Error && error.message === 'EXPIRED') return fail(t.verification_code_expired)
    console.error('verifyRegistrationCode failed', error)
    return fail(t.register_failed)
  }
}

export async function completeGoogleRegistration(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = googleRegisterSchema.safeParse(input)
  if (!parsed.success) {
    return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))
  }

  const ip = await clientIp()
  const limit = rateLimit(`google-register:${ip}`, 5, minutes(30))
  if (!limit.ok) return fail(dict.errors.rate_limited(30))

  const jar = await cookies()
  const registration = readGoogleRegistration(jar.get(GOOGLE_REGISTRATION_COOKIE)?.value)
  if (!registration) return fail(t.google_registration_expired)

  const { name, username, password, university, location } = parsed.data
  try {
    const clash = await db.user.findFirst({
      where: { OR: [{ username }, { email: registration.email }] },
      select: { username: true, email: true },
    })
    if (clash) {
      return fail(
        t.account_exists,
        clash.username === username ? { username: t.username_taken } : { email: t.email_registered }
      )
    }

    const user = await db.user.create({
      data: {
        name,
        username,
        email: registration.email,
        passwordHash: await hashPassword(password),
        role: 'USER',
        verified: true,
        bio: '',
        university: university || null,
        location: location || '',
        joinedDate: new Date().toISOString().slice(0, 10),
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: new Date(),
        privacyVersion: PRIVACY_VERSION,
      },
      select: { id: true },
    })

    await createSession(user.id, await userAgent())
    jar.delete(GOOGLE_REGISTRATION_COOKIE)
    revalidatePath('/', 'layout')
    return succeedWith({ redirectTo: '/feed' })
  } catch (error) {
    const clash = await db.user.findFirst({
      where: { OR: [{ username }, { email: registration.email }] },
      select: { username: true },
    }).catch(() => null)
    if (clash) {
      return fail(t.account_exists, clash.username === username ? { username: t.username_taken } : undefined)
    }
    console.error('completeGoogleRegistration failed', error)
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

export async function requestPasswordReset(input: unknown): Promise<ActionResult<{ email: string }>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = passwordResetRequestSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const email = parsed.data.email
  const ip = await clientIp()
  for (const key of [`password-reset:ip:${ip}`, `password-reset:email:${email}`]) {
    const limit = rateLimit(key, 5, minutes(30))
    if (!limit.ok) return fail(dict.errors.rate_limited(30))
  }

  try {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
    const codeHash = await hashPassword(code)
    const user = await db.user.findUnique({ where: { email }, select: { id: true } })

    if (user) {
      const existing = await db.passwordReset.findUnique({ where: { email }, select: { lastSentAt: true } })
      if (!existing || Date.now() - existing.lastSentAt.getTime() >= minutes(1)) {
        await db.passwordReset.upsert({
          where: { email },
          create: { email, codeHash, expiresAt: new Date(Date.now() + minutes(10)) },
          update: {
            codeHash,
            attempts: 0,
            expiresAt: new Date(Date.now() + minutes(10)),
            lastSentAt: new Date(),
          },
        })
        try {
          await sendPasswordResetCode(email, code)
        } catch {
          await db.passwordReset.deleteMany({ where: { email } })
          return fail(t.password_reset_email_failed)
        }
      }
    }

    // Deliberately identical response for existing and unknown emails.
    return succeedWith({ email })
  } catch (error) {
    console.error('requestPasswordReset failed', error)
    return fail(t.password_reset_failed)
  }
}

export async function completePasswordReset(input: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = passwordResetCompleteSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const ip = await clientIp()
  const limit = rateLimit(`password-reset-complete:${ip}`, 15, minutes(15))
  if (!limit.ok) return fail(dict.errors.rate_limited(15))

  const pending = await db.passwordReset.findUnique({ where: { email: parsed.data.email } })
  if (!pending || pending.expiresAt.getTime() < Date.now() || pending.attempts >= 5) {
    if (pending && pending.expiresAt.getTime() < Date.now()) await db.passwordReset.deleteMany({ where: { id: pending.id } })
    return fail(t.password_reset_code_invalid, { code: t.password_reset_code_invalid })
  }

  if (!(await verifyPassword(parsed.data.code, pending.codeHash))) {
    await db.passwordReset.update({ where: { id: pending.id }, data: { attempts: { increment: 1 } } })
    return fail(t.password_reset_code_invalid, { code: t.password_reset_code_invalid })
  }

  try {
    const user = await db.$transaction(async (tx) => {
      const fresh = await tx.passwordReset.findUnique({ where: { id: pending.id } })
      if (!fresh || fresh.expiresAt.getTime() < Date.now()) throw new Error('INVALID_RESET')
      const record = await tx.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })
      if (!record) throw new Error('INVALID_RESET')
      await tx.user.update({
        where: { id: record.id },
        data: { passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false },
      })
      await tx.passwordReset.delete({ where: { id: fresh.id } })
      return record
    })
    await destroyAllSessions(user.id)
    return succeedWith({ redirectTo: '/login?password_reset=1' })
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_RESET') {
      return fail(t.password_reset_code_invalid, { code: t.password_reset_code_invalid })
    }
    console.error('completePasswordReset failed', error)
    return fail(t.password_reset_failed)
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
  const word = dict.account.delete_account.confirm_word
  if (!matchesConfirmWord(parsed.data.confirm, word)) {
    return fail(t.confirm_failed, { confirm: dict.errors.delete_confirm(word) })
  }

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
