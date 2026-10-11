'use server'

import { revalidatePath } from 'next/cache'
import { db } from './db'
import { getCurrentUser } from './session'
import { ensureOrganizationChannel, slugify } from './channels'
import { generatePassword, hashPassword } from './password'
import {
  approveApplicationSchema,
  fieldErrors,
  organizationApplicationSchema,
  rejectApplicationSchema,
} from './schemas'
import { fail, succeedWith, type ActionResult } from './action-result'
import { clientIp, minutes, rateLimit } from './rate-limit'
import type { ProvisionedCredentials } from './org-types'
import { getI18n } from './i18n/server'

// ------------------------------------------------------------
// Public: apply to become an organization
// ------------------------------------------------------------

export async function submitOrganizationApplication(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const parsed = organizationApplicationSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const ip = await clientIp()
  const limit = rateLimit(`org-apply:${ip}`, 3, minutes(60))
  if (!limit.ok) return fail(t.too_many_applications)

  const data = parsed.data

  try {
    const pending = await db.organizationApplication.findFirst({
      where: { email: data.email, status: 'PENDING' },
      select: { id: true },
    })
    if (pending) {
      return fail(t.application_pending, {
        email: t.application_already_sent,
      })
    }

    await db.organizationApplication.create({
      data: {
        orgName: data.orgName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone || null,
        website: data.website || null,
        location: data.location || '',
        description: data.description,
        status: 'PENDING',
      },
    })

    revalidatePath('/admin/applications')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    console.error('submitOrganizationApplication failed', error)
    return fail(t.application_failed)
  }
}

// ------------------------------------------------------------
// Super admin: review applications
// ------------------------------------------------------------

async function requireAdmin() {
  const { dict } = await getI18n()
  const user = await getCurrentUser()
  if (!user) return { error: dict.errors.login_required, user: null }
  if (user.role !== 'SUPER_ADMIN') return { error: dict.errors.super_admin_only, user: null }
  return { error: null, user }
}

/**
 * Approve an application and provision the organization account.
 *
 * The generated password is returned **once** — it is stored only as a
 * scrypt hash, so the super admin has to hand it over now. The account is
 * flagged `mustChangePassword` so the organization rotates it on first login.
 */
export async function approveOrganizationApplication(
  input: unknown
): Promise<ActionResult<ProvisionedCredentials>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const auth = await requireAdmin()
  if (auth.error) return fail(auth.error)

  const parsed = approveApplicationSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { applicationId, username, note } = parsed.data

  try {
    const application = await db.organizationApplication.findUnique({ where: { id: applicationId } })
    if (!application) return fail(t.application_not_found)
    if (application.status !== 'PENDING') return fail(t.application_reviewed)

    const clash = await db.user.findFirst({
      where: { OR: [{ username }, { email: application.email }] },
      select: { username: true },
    })
    if (clash) {
      return fail(
        clash.username === username ? t.username_taken : t.email_account_exists,
        clash.username === username ? { username: t.username_taken_short } : undefined
      )
    }

    const password = generatePassword()
    const passwordHash = await hashPassword(password)

    let slug = slugify(application.orgName) || slugify(username)
    for (let i = 2; i < 50; i++) {
      const taken = await db.organization.findUnique({ where: { slug }, select: { id: true } })
      if (!taken) break
      slug = `${slugify(application.orgName)}-${i}`
    }

    const organization = await db.$transaction(async (tx) => {
      const owner = await tx.user.create({
        data: {
          name: application.orgName,
          username,
          email: application.email,
          passwordHash,
          role: 'ORGANIZATION',
          verified: true,
          bio: application.description.slice(0, 500),
          location: application.location,
          joinedDate: new Date().toISOString().slice(0, 10),
          mustChangePassword: true,
        },
        select: { id: true },
      })

      const org = await tx.organization.create({
        data: {
          name: application.orgName,
          slug,
          description: application.description,
          email: application.email,
          phone: application.phone,
          website: application.website,
          location: application.location,
          status: 'ACTIVE',
          ownerId: owner.id,
        },
        select: { id: true, name: true },
      })

      await tx.organizationApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedById: auth.user!.id,
          reviewedAt: new Date(),
          reviewNote: note || null,
          organizationId: org.id,
        },
      })

      return org
    })

    await ensureOrganizationChannel(organization.id)

    revalidatePath('/admin')
    revalidatePath('/admin/applications')
    revalidatePath('/admin/organizations')
    revalidatePath('/organizations')

    return succeedWith({
      organizationName: organization.name,
      username,
      email: application.email,
      password,
    })
  } catch (error) {
    console.error('approveOrganizationApplication failed', error)
    return fail(t.approve_failed)
  }
}

export async function rejectOrganizationApplication(input: unknown): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const auth = await requireAdmin()
  if (auth.error) return fail(auth.error)

  const parsed = rejectApplicationSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  try {
    const application = await db.organizationApplication.findUnique({
      where: { id: parsed.data.applicationId },
      select: { status: true },
    })
    if (!application) return fail(t.application_not_found)
    if (application.status !== 'PENDING') return fail(t.application_reviewed)

    await db.organizationApplication.update({
      where: { id: parsed.data.applicationId },
      data: {
        status: 'REJECTED',
        reviewedById: auth.user!.id,
        reviewedAt: new Date(),
        reviewNote: parsed.data.note,
      },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/applications')
    return { ok: true }
  } catch (error) {
    console.error('rejectOrganizationApplication failed', error)
    return fail(t.reject_failed)
  }
}

// ------------------------------------------------------------
// Super admin: manage existing organizations
// ------------------------------------------------------------

export async function setOrganizationStatus(
  organizationId: string,
  status: 'ACTIVE' | 'SUSPENDED'
): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const auth = await requireAdmin()
  if (auth.error) return fail(auth.error)

  try {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    })
    if (!organization) return fail(t.org_not_found)

    await db.organization.update({ where: { id: organizationId }, data: { status } })

    // Suspending kicks the account out of every browser immediately.
    if (status === 'SUSPENDED') {
      await db.session.deleteMany({ where: { userId: organization.ownerId } })
    }

    revalidatePath('/admin/organizations')
    revalidatePath('/admin')
    return { ok: true }
  } catch (error) {
    console.error('setOrganizationStatus failed', error)
    return fail(t.status_change_failed)
  }
}

/** Issue a fresh password for an organization that lost access. */
export async function resetOrganizationPassword(
  organizationId: string
): Promise<ActionResult<ProvisionedCredentials>> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const auth = await requireAdmin()
  if (auth.error) return fail(auth.error)

  try {
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, owner: { select: { id: true, username: true, email: true } } },
    })
    if (!organization) return fail(t.org_not_found)

    const password = generatePassword()
    await db.user.update({
      where: { id: organization.owner.id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true },
    })
    await db.session.deleteMany({ where: { userId: organization.owner.id } })

    revalidatePath('/admin/organizations')
    return succeedWith({
      organizationName: organization.name,
      username: organization.owner.username,
      email: organization.owner.email ?? '',
      password,
    })
  } catch (error) {
    console.error('resetOrganizationPassword failed', error)
    return fail(t.password_reset_failed)
  }
}
