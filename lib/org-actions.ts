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
  const proofEntry = typeof input === 'object' && input !== null && 'proofFile' in input ? input.proofFile : null
  const proofFile = proofEntry instanceof File && proofEntry.size > 0 && proofEntry.name ? proofEntry : null
  const allowedProofTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  if (proofFile && proofFile.size > 5 * 1024 * 1024) {
    return fail(t.proof_too_large, { proofFile: t.proof_too_large })
  }
  if (proofFile && !allowedProofTypes.includes(proofFile.type)) {
    return fail(t.proof_bad_type, { proofFile: t.proof_bad_type })
  }

  try {
    const [accountClash, pending] = await Promise.all([
      db.user.findFirst({
        where: { OR: [{ email: data.email }, { username: data.username }] },
        select: { email: true, username: true },
      }),
      db.organizationApplication.findFirst({
        where: { status: 'PENDING', OR: [{ email: data.email }, { requestedUsername: data.username }] },
        select: { email: true, requestedUsername: true },
      }),
    ])
    if (accountClash) {
      return fail(
        t.account_exists,
        accountClash.username === data.username
          ? { username: t.username_taken }
          : { email: t.email_registered }
      )
    }
    if (pending) {
      return fail(
        t.application_pending,
        pending.requestedUsername === data.username
          ? { username: t.username_taken }
          : { email: t.application_already_sent }
      )
    }

    const [passwordHash, proofData] = await Promise.all([
      hashPassword(data.password),
      proofFile ? proofFile.arrayBuffer().then((bytes) => Buffer.from(bytes)) : Promise.resolve(null),
    ])

    await db.organizationApplication.create({
      data: {
        orgName: data.orgName,
        contactName: data.contactName,
        requestedUsername: data.username,
        passwordHash,
        proofFileName: proofFile?.name.slice(0, 180) || null,
        proofMimeType: proofFile?.type || null,
        proofByteSize: proofFile?.size || null,
        proofData,
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
 * Approve an application and activate the credentials selected by the applicant.
 */
export async function approveOrganizationApplication(
  input: unknown
): Promise<ActionResult> {
  const { dict } = await getI18n()
  const t = dict.account.actions
  const auth = await requireAdmin()
  if (auth.error) return fail(auth.error)

  const parsed = approveApplicationSchema.safeParse(input)
  if (!parsed.success) return fail(dict.errors.form_has_errors, fieldErrors(parsed.error, dict))

  const { applicationId, note } = parsed.data

  try {
    const application = await db.organizationApplication.findUnique({ where: { id: applicationId } })
    if (!application) return fail(t.application_not_found)
    if (application.status !== 'PENDING') return fail(t.application_reviewed)
    if (!application.requestedUsername || !application.passwordHash) return fail(t.application_credentials_missing)

    const username = application.requestedUsername

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
          passwordHash: application.passwordHash,
          role: 'ORGANIZATION',
          verified: true,
          bio: application.description.slice(0, 500),
          location: application.location,
          joinedDate: new Date().toISOString().slice(0, 10),
          mustChangePassword: false,
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

    return { ok: true }
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
