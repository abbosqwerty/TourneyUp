import { z } from 'zod'

const trimmed = (max: number) => z.string().trim().max(max)

export const usernameSchema = trimmed(30)
  .min(3, 'Username kamida 3 belgi bo‘lishi kerak')
  .regex(/^[a-z0-9_]+$/, 'Username faqat kichik harf, raqam va _ dan iborat bo‘lsin')

export const passwordSchema = z
  .string()
  .min(8, 'Parol kamida 8 belgi bo‘lishi kerak')
  .max(128, 'Parol juda uzun')

export const registerSchema = z.object({
  name: trimmed(80).min(2, 'Ism kamida 2 belgi'),
  username: usernameSchema,
  email: trimmed(120).email('Email formati noto‘g‘ri').toLowerCase(),
  password: passwordSchema,
  university: trimmed(120).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  identifier: trimmed(120).min(3, 'Email yoki username kiriting'),
  password: z.string().min(1, 'Parolni kiriting'),
})

export const updateProfileSchema = z.object({
  name: trimmed(80).min(2, 'Ism kamida 2 belgi'),
  username: usernameSchema,
  bio: trimmed(500).optional().or(z.literal('')),
  university: trimmed(120).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
  avatarMediaId: z.string().optional().or(z.literal('')),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Parolni kiriting'),
  confirm: z.literal('O‘CHIRISH', { message: 'Tasdiqlash uchun O‘CHIRISH deb yozing' }),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Hozirgi parolni kiriting'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Parollar mos kelmadi',
    path: ['confirmPassword'],
  })

export const organizationApplicationSchema = z.object({
  orgName: trimmed(120).min(3, 'Tashkilot nomi kamida 3 belgi'),
  contactName: trimmed(80).min(2, 'Mas’ul shaxs ismini kiriting'),
  email: trimmed(120).email('Email formati noto‘g‘ri').toLowerCase(),
  phone: trimmed(30).optional().or(z.literal('')),
  website: trimmed(200).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
  description: trimmed(2000).min(30, 'Tashkilot haqida kamida 30 belgi yozing'),
})

export const approveApplicationSchema = z.object({
  applicationId: z.string().min(1),
  username: usernameSchema,
  note: trimmed(500).optional().or(z.literal('')),
})

export const rejectApplicationSchema = z.object({
  applicationId: z.string().min(1),
  note: trimmed(500).min(5, 'Rad etish sababini yozing'),
})

export const tournamentStatuses = ['upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled'] as const
export const tournamentCategories = ['sports', 'esports', 'academic'] as const
export const staffRoles = ['ADMIN', 'ORGANIZER', 'SUPPORT'] as const

export const createTournamentSchema = z.object({
  title: trimmed(140).min(5, 'Sarlavha kamida 5 belgi'),
  sport: trimmed(60).min(2, 'Sport turini tanlang'),
  category: z.enum(tournamentCategories),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana YYYY-MM-DD formatida bo‘lsin'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Sana YYYY-MM-DD formatida bo‘lsin')
    .optional()
    .or(z.literal('')),
  time: trimmed(20).min(3, 'Vaqtni kiriting'),
  location: trimmed(140).min(2, 'Manzilni kiriting'),
  maxParticipants: z.coerce
    .number()
    .int('Butun son kiriting')
    .min(2, 'Kamida 2 ishtirokchi')
    .max(100_000, 'Juda katta qiymat'),
  description: trimmed(5000).min(20, 'Tavsif kamida 20 belgi'),
  rules: trimmed(5000).optional().or(z.literal('')),
  requirements: trimmed(5000).optional().or(z.literal('')),
  prizePool: trimmed(60).optional().or(z.literal('')),
  entryFee: trimmed(60).optional().or(z.literal('')),
  posterMediaId: z.string().optional().or(z.literal('')),
})

export const updateTournamentSchema = createTournamentSchema.extend({
  tournamentId: z.string().min(1),
})

export const setTournamentStatusSchema = z.object({
  tournamentId: z.string().min(1),
  status: z.enum(tournamentStatuses),
})

export const registerParticipantSchema = z.object({
  tournamentId: z.string().min(1),
  teamName: trimmed(60).optional().or(z.literal('')),
})

export const participantStatusSchema = z.object({
  participantId: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']),
})

export const assignStaffSchema = z.object({
  tournamentId: z.string().min(1),
  userQuery: trimmed(120).min(2, 'Username yoki email kiriting'),
  role: z.enum(staffRoles),
})

export const revokeStaffSchema = z.object({
  staffId: z.string().min(1),
  reason: trimmed(200).optional().or(z.literal('')),
})

export const matchStatuses = ['scheduled', 'live', 'completed', 'cancelled'] as const

const optionalId = z.string().optional().or(z.literal(''))

export const createMatchSchema = z.object({
  tournamentId: z.string().min(1),
  stage: trimmed(60).optional().or(z.literal('')),
  scheduledAt: trimmed(40).optional().or(z.literal('')),
  homeParticipantId: optionalId,
  awayParticipantId: optionalId,
  /** Used when a side has no registration row (e.g. an invited guest team). */
  homeLabel: trimmed(80).optional().or(z.literal('')),
  awayLabel: trimmed(80).optional().or(z.literal('')),
})

export const recordMatchResultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int('Butun son kiriting').min(0, 'Manfiy bo‘lmasin').max(999),
  awayScore: z.coerce.number().int('Butun son kiriting').min(0, 'Manfiy bo‘lmasin').max(999),
  notes: trimmed(500).optional().or(z.literal('')),
})

export const setMatchStatusSchema = z.object({
  matchId: z.string().min(1),
  status: z.enum(matchStatuses),
})

export const channelPostSchema = z.object({
  channelId: z.string().min(1),
  content: trimmed(4000).min(1, 'Xabar bo‘sh bo‘lmasin'),
  mediaId: z.string().optional().or(z.literal('')),
})

export const createStorySchema = z.object({
  mediaId: z.string().min(1, 'Rasm yuklang'),
  caption: trimmed(200).optional().or(z.literal('')),
  tournamentId: z.string().optional().or(z.literal('')),
})

/** Flatten a ZodError into `{ field: message }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (!out[key]) out[key] = issue.message
  }
  return out
}
