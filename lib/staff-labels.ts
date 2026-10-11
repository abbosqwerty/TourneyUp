/**
 * Client-safe labels for the temporary tournament roles.
 * Kept apart from `lib/staff.ts` so client components never pull in Prisma.
 */
export type StaffRoleName = 'ADMIN' | 'ORGANIZER' | 'SUPPORT'

export const STAFF_ROLE_LABELS: Record<StaffRoleName, string> = {
  ADMIN: 'Admin',
  ORGANIZER: 'Turnir tashkilotchisi',
  SUPPORT: 'Qo‘llab-quvvatlash',
}

export const STAFF_ROLE_DESCRIPTIONS: Record<StaffRoleName, string> = {
  ADMIN: 'Turnirni to‘liq boshqaradi: tahrirlash, ishtirokchilar, xodimlar, kanal.',
  ORGANIZER: 'Turnirni tahrirlaydi, ishtirokchilarni tasdiqlaydi, natija kiritadi.',
  SUPPORT: 'Ishtirokchilar savollariga kanalda javob beradi.',
}

/**
 * Revoke reasons the system writes itself. They are stored as written (in
 * Uzbek) on the grant row; `revokeReasonLabel` swaps them for the viewer's
 * language, while a reason typed by an organizer is shown as is.
 */
export const REVOKE_REASON_CLOSED = 'Turnir yopildi — vaqtinchalik ruxsat avtomatik olib tashlandi'
export const REVOKE_REASON_BY_ORG = 'Tashkilot tomonidan olib tashlandi'

export function revokeReasonLabel(
  reason: string,
  dict: { dashboard: { revoke_reasons: { closed: string; by_org: string } } }
): string {
  if (reason === REVOKE_REASON_CLOSED) return dict.dashboard.revoke_reasons.closed
  if (reason === REVOKE_REASON_BY_ORG) return dict.dashboard.revoke_reasons.by_org
  return reason
}
