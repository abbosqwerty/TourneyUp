import { z } from 'zod'
import type { Dictionary } from './i18n/dictionaries'
import { TOURNAMENT_FORMATS } from './competition/config'

const trimmed = (max: number) => z.string().trim().max(max)

export const usernameSchema = trimmed(30)
  .min(3, 'username_min')
  .regex(/^[a-z0-9_]+$/, 'username_format')

export const passwordSchema = z
  .string()
  .min(8, 'password_min')
  .max(128, 'password_too_long')

export const registerSchema = z.object({
  name: trimmed(80).min(2, 'name_min'),
  username: usernameSchema,
  email: trimmed(120).email('email_invalid').toLowerCase(),
  password: passwordSchema,
  university: trimmed(120).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
})

export const loginSchema = z.object({
  identifier: trimmed(120).min(3, 'identifier_required'),
  password: z.string().min(1, 'password_required'),
})

export const updateProfileSchema = z.object({
  name: trimmed(80).min(2, 'name_min'),
  username: usernameSchema,
  bio: trimmed(500).optional().or(z.literal('')),
  university: trimmed(120).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
  avatarMediaId: z.string().optional().or(z.literal('')),
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'password_required'),
  confirm: z.literal('O‘CHIRISH', { errorMap: () => ({ message: 'delete_confirm' }) }),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'current_password_required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'passwords_mismatch',
    path: ['confirmPassword'],
  })

export const organizationApplicationSchema = z.object({
  orgName: trimmed(120).min(3, 'org_name_min'),
  contactName: trimmed(80).min(2, 'contact_name_required'),
  email: trimmed(120).email('email_invalid').toLowerCase(),
  phone: trimmed(30).optional().or(z.literal('')),
  website: trimmed(200).optional().or(z.literal('')),
  location: trimmed(80).optional().or(z.literal('')),
  description: trimmed(2000).min(30, 'org_description_min'),
})

export const approveApplicationSchema = z.object({
  applicationId: z.string().min(1),
  username: usernameSchema,
  note: trimmed(500).optional().or(z.literal('')),
})

export const rejectApplicationSchema = z.object({
  applicationId: z.string().min(1),
  note: trimmed(500).min(5, 'reject_reason_required'),
})

export const tournamentStatuses = ['upcoming', 'registration_open', 'ongoing', 'completed', 'cancelled'] as const
export const tournamentCategories = ['sports', 'esports', 'academic'] as const
export const staffRoles = ['ADMIN', 'ORGANIZER', 'SUPPORT'] as const

/** Empty form input → undefined, otherwise a whole number. */
const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z.coerce.number().int('integer_required').min(min, `min_value:${min}`).max(max, `max_value:${max}`).optional()
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
    scoreKind: z.enum(['points', 'time']).optional(),
    leaderboardRounds: optionalInt(1, 20),
  })
  .partial()

const tournamentBaseSchema = z.object({
  title: trimmed(140).min(5, 'title_min'),
  sport: trimmed(60).min(2, 'sport_required'),
  category: z.enum(tournamentCategories),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_format'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_format')
    .optional()
    .or(z.literal('')),
  time: trimmed(20).min(3, 'time_required'),
  location: trimmed(140).min(2, 'location_required'),
  maxParticipants: z.coerce
    .number()
    .int('integer_required')
    .min(2, 'participants_min')
    .max(100_000, 'value_too_large'),
  description: trimmed(5000).min(20, 'description_min'),
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
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['teamSize'], message: 'team_size_required' })
  } else if (data.teamSizeMax && data.teamSizeMax < data.teamSize) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['teamSizeMax'], message: 'team_size_max_below_min' })
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
  name: trimmed(50).min(2, 'team_name_min'),
  sport: trimmed(60).min(2, 'game_required'),
  category: z.enum(tournamentCategories),
  description: trimmed(500).optional().or(z.literal('')),
  logoMediaId: z.string().optional().or(z.literal('')),
})

export const updateTeamSchema = teamFieldsSchema.extend({ teamId: z.string().min(1) })

export const inviteMemberSchema = z.object({
  teamId: z.string().min(1),
  userQuery: trimmed(120).min(2, 'user_query_required'),
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
  userQuery: trimmed(120).min(2, 'user_query_required'),
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
    if (data.homeScore === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['homeScore'], message: 'score_required' })
    if (data.awayScore === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['awayScore'], message: 'score_required' })
  })

/** One round of a LEADERBOARD tournament; `value` is points or milliseconds. */
export const recordLeaderboardSchema = z.object({
  tournamentId: z.string().min(1),
  round: z.coerce.number().int().min(1).max(20),
  results: z
    .array(
      z.object({
        participantId: z.string().min(1),
        value: z.number().int().min(0).max(2_000_000_000).nullable(),
        dnf: z.boolean(),
      })
    )
    .min(1)
    .max(1000),
  reason: trimmed(500).optional().or(z.literal('')),
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
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'datetime_required')
    .optional()
    .or(z.literal('')),
})

export const participantSeedSchema = z.object({
  participantId: z.string().min(1),
  seed: optionalInt(1, 10_000),
})

export const channelPostSchema = z.object({
  channelId: z.string().min(1),
  content: trimmed(4000).min(1, 'message_empty'),
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
    subject: trimmed(140).min(4, 'subject_min'),
    content: trimmed(4000).min(10, 'ticket_content_min'),
  })
  .superRefine((data, ctx) => {
    if (data.scope === 'TOURNAMENT' && !data.tournamentId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['tournamentId'], message: 'tournament_required' })
    }
  })

export const replyTicketSchema = z.object({
  ticketId: z.string().min(1),
  content: trimmed(4000).min(1, 'message_empty'),
})

export const ticketStatusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']),
})

export const createStorySchema = z.object({
  mediaId: z.string().min(1, 'media_required'),
  caption: trimmed(200).optional().or(z.literal('')),
  tournamentId: z.string().min(1, 'tournament_required'),
})

/**
 * Schema messages are keys of `dict.errors` (e.g. 'passwords_mismatch') so one
 * schema serves every language. A parametrized message is written
 * 'key:param' (e.g. 'too_long:200' → dict.errors.too_long(200)). Anything not
 * found is shown as written.
 */
export function translateError(dict: Dictionary, message: string): string {
  const table = dict.errors as Record<string, unknown>
  const entry = table[message]
  if (typeof entry === 'string') return entry

  const colon = message.indexOf(':')
  if (colon > 0) {
    const fn = table[message.slice(0, colon)]
    if (typeof fn === 'function') {
      const raw = message.slice(colon + 1)
      const param = raw !== '' && !Number.isNaN(Number(raw)) ? Number(raw) : raw
      return (fn as (value: unknown) => string)(param)
    }
  }
  return message
}

/**
 * zod's built-in English messages (checks without a custom message, e.g. the
 * `.max(n)` in `trimmed`) mapped to an errors key from the issue itself.
 */
function defaultIssueKey(issue: z.ZodIssue): string {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return 'required'
      if (issue.expected === 'number' || issue.expected === 'integer') return 'number_required'
      return 'invalid_value'
    case z.ZodIssueCode.too_small: {
      const min = Number(issue.minimum)
      if (issue.type === 'string') return min <= 1 ? 'required' : `too_short:${min}`
      if (issue.type === 'number' || issue.type === 'bigint') return `min_value:${min}`
      if (issue.type === 'array' || issue.type === 'set') return `too_few_items:${min}`
      return 'invalid_value'
    }
    case z.ZodIssueCode.too_big: {
      const max = Number(issue.maximum)
      if (issue.type === 'string') return `too_long:${max}`
      if (issue.type === 'number' || issue.type === 'bigint') return `max_value:${max}`
      if (issue.type === 'array' || issue.type === 'set') return `too_many_items:${max}`
      return 'invalid_value'
    }
    case z.ZodIssueCode.invalid_string:
      return issue.validation === 'email' ? 'email_invalid' : 'invalid_format'
    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_literal:
    case z.ZodIssueCode.invalid_union:
    case z.ZodIssueCode.invalid_union_discriminator:
      return 'invalid_option'
    default:
      return 'invalid_value'
  }
}

/** True when the issue still carries zod's own (English) default message. */
function hasDefaultMessage(issue: z.ZodIssue): boolean {
  try {
    return z.defaultErrorMap(issue, { data: undefined, defaultError: '' }).message === issue.message
  } catch {
    return false
  }
}

/** Flatten a ZodError into `{ field: message }` for form rendering, translated. */
export function fieldErrors(error: z.ZodError, dict: Dictionary): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_'
    if (out[key]) continue
    const message = hasDefaultMessage(issue) ? defaultIssueKey(issue) : issue.message
    out[key] = translateError(dict, message)
  }
  return out
}
