import { z } from 'zod'
import { TOURNAMENT_FORMATS } from './competition/config'

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

/** Empty form input → undefined, otherwise a whole number. */
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().int('Butun son kiriting').min(min, `Kamida ${min}`).max(max, `Ko‘pi bilan ${max}`).optional()
  )

export const participantTypes = ['INDIVIDUAL', 'TEAM'] as const

/** Format options as the create form sends them; defaults live in lib/competition/config. */
export const formatConfigInputSchema = z
  .object({
    seeding: z.enum(['random', 'seeded']).optional(),
    thirdPlaceMatch: z.boolean().optional(),
    grandFinalReset: z.boolean().optional(),
    groupCount: optionalInt(1, 64),
    advancePerGroup: optionalInt(1, 16),
    swissRounds: optionalInt(1, 30),
    winPoints: z.coerce.number().min(0).max(10).optional(),
    drawPoints: z.coerce.number().min(0).max(10).optional(),
    lossPoints: z.coerce.number().min(0).max(10).optional(),
  })
  .partial()

const tournamentBaseSchema = z.object({
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
  galleryMediaIds: z.array(z.string()).max(4).optional(),
  format: z.enum(TOURNAMENT_FORMATS).default('SINGLE_ELIMINATION'),
  participantType: z.enum(participantTypes).default('INDIVIDUAL'),
  teamSize: optionalInt(1, 50),
  teamSizeMax: optionalInt(1, 50),
  formatConfig: formatConfigInputSchema.optional(),
})

type TeamSizeFields = { participantType: string; teamSize?: number; teamSizeMax?: number }

/** A team tournament needs a roster size, and the maximum cannot be below it. */
function checkTeamSize(data: TeamSizeFields, ctx: z.RefinementCtx) {
  if (data.participantType !== 'TEAM') return
  if (!data.teamSize) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['teamSize'], message: 'Jamoa tarkibi sonini kiriting' })
  } else if (data.teamSizeMax && data.teamSizeMax < data.teamSize) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['teamSizeMax'], message: 'Minimaldan kichik bo‘lmasin' })
  }
}

export const createTournamentSchema = tournamentBaseSchema.superRefine(checkTeamSize)

export const updateTournamentSchema = tournamentBaseSchema
  .extend({ tournamentId: z.string().min(1) })
  .superRefine(checkTeamSize)

export const setTournamentStatusSchema = z.object({
  tournamentId: z.string().min(1),
  status: z.enum(tournamentStatuses),
})

export const registerParticipantSchema = z.object({
  tournamentId: z.string().min(1),
  teamName: trimmed(60).optional().or(z.literal('')),
  /** Team tournaments: which team, and which of its members play. */
  teamId: z.string().optional().or(z.literal('')),
  rosterUserIds: z.array(z.string().min(1)).max(50).optional(),
})

// ------------------------------------------------------------
// Teams
// ------------------------------------------------------------

export const teamFieldsSchema = z.object({
  name: trimmed(50).min(2, 'Jamoa nomi kamida 2 belgi'),
  sport: trimmed(60).min(2, 'O‘yin turini tanlang'),
  category: z.enum(tournamentCategories),
  description: trimmed(500).optional().or(z.literal('')),
  logoMediaId: z.string().optional().or(z.literal('')),
})

export const updateTeamSchema = teamFieldsSchema.extend({ teamId: z.string().min(1) })

export const inviteMemberSchema = z.object({
  teamId: z.string().min(1),
  userQuery: trimmed(120).min(2, 'Username yoki email kiriting'),
})

export const respondInviteSchema = z.object({
  inviteId: z.string().min(1),
  accept: z.boolean(),
})

export const teamMemberSchema = z.object({
  teamId: z.string().min(1),
  userId: z.string().min(1),
})

export const setTeamRoleSchema = teamMemberSchema.extend({
  role: z.enum(['CAPTAIN', 'MEMBER']),
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

export const recordMatchResultSchema = z
  .object({
    matchId: z.string().min(1),
    homeScore: optionalInt(0, 999),
    awayScore: optionalInt(0, 999),
    /** The side that did not show up — that side did not participate. */
    forfeit: z.enum(['HOME', 'AWAY']).optional().or(z.literal('')),
    notes: trimmed(500).optional().or(z.literal('')),
    /** Required when changing an already-finalized result. */
    reason: trimmed(500).optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.forfeit) return
    if (data.homeScore === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['homeScore'], message: 'Hisobni kiriting' })
    if (data.awayScore === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['awayScore'], message: 'Hisobni kiriting' })
  })

/** Only the live/scheduled toggle — completion goes through the result form. */
export const setMatchStatusSchema = z.object({
  matchId: z.string().min(1),
  status: z.enum(['scheduled', 'live']),
})

export const scheduleMatchSchema = z.object({
  matchId: z.string().min(1),
  /** `YYYY-MM-DDTHH:mm` in Tashkent time, or empty to clear. */
  scheduledAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Sana va vaqtni kiriting')
    .optional()
    .or(z.literal('')),
})

export const participantSeedSchema = z.object({
  participantId: z.string().min(1),
  seed: optionalInt(1, 10_000),
})

export const channelPostSchema = z.object({
  channelId: z.string().min(1),
  content: trimmed(4000).min(1, 'Xabar bo‘sh bo‘lmasin'),
  mediaId: z.string().optional().or(z.literal('')),
  /** Publish as an official announcement (organizer side only). */
  announce: z.boolean().optional(),
})

// ------------------------------------------------------------
// Support
// ------------------------------------------------------------

export const supportCategories = ['TECHNICAL', 'TOURNAMENT_ISSUE', 'REPORT_BEHAVIOR', 'ACCOUNT', 'OTHER'] as const

export const createTicketSchema = z
  .object({
    scope: z.enum(['PLATFORM', 'TOURNAMENT']),
    tournamentId: z.string().optional().or(z.literal('')),
    category: z.enum(supportCategories),
    subject: trimmed(140).min(4, 'Mavzu kamida 4 belgi'),
    content: trimmed(4000).min(10, 'Muammoni batafsilroq yozing (kamida 10 belgi)'),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'TOURNAMENT' && !data.tournamentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tournamentId'], message: 'Turnirni tanlang' })
    }
  })

export const replyTicketSchema = z.object({
  ticketId: z.string().min(1),
  content: trimmed(4000).min(1, 'Xabar bo‘sh bo‘lmasin'),
})

export const ticketStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export const createStorySchema = z.object({
  mediaId: z.string().min(1, 'Rasm yoki video yuklang'),
  caption: trimmed(200).optional().or(z.literal('')),
  tournamentId: z.string().min(1, 'Turnirni tanlang'),
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
