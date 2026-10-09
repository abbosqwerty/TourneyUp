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
