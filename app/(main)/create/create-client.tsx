'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileText,
  Upload,
  Eye,
  Gamepad2,
  Dribbble,
  GraduationCap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ImageUploader, type UploadedImage } from '@/components/image-uploader'
import { createTournament } from '@/lib/actions'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { TOURNAMENT_FORMATS, suggestFormat, type TournamentFormat } from '@/lib/competition/config'
import { useLanguage } from '@/lib/i18n/language-context'
import { formatClock, formatDate } from '@/lib/time'

type FormatState = {
  format: TournamentFormat
  participantType: 'INDIVIDUAL' | 'TEAM'
  teamSize: string
  teamSizeMax: string
  seeding: 'random' | 'seeded'
  thirdPlaceMatch: boolean
  grandFinalReset: boolean
  groupCount: string
  advancePerGroup: string
  swissRounds: string
  winPoints: string
  drawPoints: string
  scoreKind: 'points' | 'time'
  leaderboardRounds: string
}

const INITIAL_FORMAT: FormatState = {
  format: 'SINGLE_ELIMINATION',
  participantType: 'INDIVIDUAL',
  teamSize: '',
  teamSizeMax: '',
  seeding: 'random',
  thirdPlaceMatch: false,
  grandFinalReset: true,
  groupCount: '',
  advancePerGroup: '2',
  swissRounds: '',
  winPoints: '3',
  drawPoints: '1',
  scoreKind: 'points',
  leaderboardRounds: '1',
}

const sportCategories = [
  { id: 'football', name: 'Football' },
  { id: 'basketball', name: 'Basketball' },
  { id: 'chess', name: 'Chess' },
  { id: 'valorant', name: 'Valorant' },
  { id: 'pubg', name: 'PUBG Mobile' },
  { id: 'rocket-league', name: 'Rocket League' },
  { id: 'swimming', name: 'Swimming' },
  { id: 'running', name: 'Running' },
  { id: 'tennis', name: 'Tennis' },
  { id: 'volleyball', name: 'Volleyball' },
  { id: 'table-tennis', name: 'Table Tennis' },
  { id: 'badminton', name: 'Badminton' },
  { id: 'league-of-legends', name: 'League of Legends' },
  { id: 'other', name: 'Other' },
] as const

type SportId = (typeof sportCategories)[number]['id']

const PRESET_TEMPLATES = [
  {
    key: 'football' as const,
    title: 'Tashkent Inter-University Football Cup',
    sport: 'football',
    category: 'sports',
    date: '2026-05-15',
    time: '10:00',
    location: 'Pakhtakor Central Stadium, Tashkent',
    maxParticipants: '16',
    prizePool: '25,000,000 UZS',
    entryFee: '200,000 UZS',
    description: 'Premier university football championship in Tashkent bringing together top student teams for glory, medals, and the university trophy.',
    rules: 'Standard FIFA 11v11 rules apply\nMatches are 2x45 minutes with 15-minute halftime\nReferee decisions are final\nSingle elimination bracket with 3rd place playoff',
    requirements: 'Must be an enrolled university student\nValid student ID card required at check-in\nTeam roster minimum 15, maximum 22 players\nMedical clearance certificate required',
  },
  {
    key: 'valorant' as const,
    title: 'Central Asia Valorant Open Championship',
    sport: 'valorant',
    category: 'esports',
    date: '2026-05-20',
    time: '18:00',
    location: 'Online (Discord & Riot Realm)',
    maxParticipants: '32',
    prizePool: '15,000,000 UZS',
    entryFee: 'Free',
    description: 'Official 5v5 Valorant community tournament open to all players in Central Asia. Live streamed with Uzbek and Russian commentary on YouTube and Twitch.',
    rules: 'Standard 5v5 Competitive rules\nVanguard anti-cheat mandatory\nGroup stage Best of 1, Playoffs Best of 3, Grand Final Best of 5\nServer: Frankfurt / Bahrain with lowest mutual ping',
    requirements: 'Account level 20+ in current or previous act\nAll team members must join the official Discord server\nMust check in 30 minutes before match time',
  },
  {
    key: 'chess' as const,
    title: 'Uzbekistan Youth Chess Grand Prix',
    sport: 'chess',
    category: 'academic',
    date: '2026-06-01',
    time: '09:30',
    location: 'International Chess Academy, Tashkent',
    maxParticipants: '64',
    prizePool: '10,000,000 UZS',
    entryFee: '50,000 UZS',
    description: 'FIDE-rated youth chess tournament featuring 7 rounds of Swiss system. Trophies, medals, and FIDE rating calculations for all participants.',
    rules: 'FIDE Rapid Chess rules apply\nTime control: 15 minutes + 10 seconds increment per move\nSwiss system, 7 rounds\nElectronic devices strictly prohibited in the playing hall',
    requirements: 'Open to players aged 14 to 28\nNational or FIDE rating ID (unrated players also welcome in section B)\nPassport or national ID card required',
  },
  {
    key: 'streetball' as const,
    title: 'TUIT Campus 3v3 Streetball Arena',
    sport: 'basketball',
    category: 'sports',
    date: '2026-05-25',
    time: '16:00',
    location: 'TUIT Indoor Sports Arena, Tashkent',
    maxParticipants: '24',
    prizePool: '8,000,000 UZS',
    entryFee: 'Free',
    description: 'High-energy 3v3 half-court basketball tournament following FIBA 3x3 rules. Music, dunk contest during halftime, and MVP trophies.',
    rules: 'FIBA 3x3 official rules\n10-minute game clock or first team to 21 points\n12-second shot clock\n1 point inside the arc, 2 points outside',
    requirements: 'Teams of 3 or 4 players (1 substitute)\nMatching jersey colors with numbers\nArrive 30 minutes before first round for warmups',
  }
]

export default function CreateTournamentClient() {
  const router = useRouter()
  const { dict, locale } = useLanguage()
  const c = dict.create
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poster, setPoster] = useState<UploadedImage | null>(null)
  const [gallery, setGallery] = useState<(UploadedImage | null)[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formatState, setFormatState] = useState<FormatState>(INITIAL_FORMAT)
  const setFormat = <K extends keyof FormatState>(field: K, value: FormatState[K]) =>
    setFormatState((prev) => ({ ...prev, [field]: value }))
  // Picking a sport pre-selects the format that fits it, until the organizer
  // chooses a format by hand.
  const [formatTouched, setFormatTouched] = useState(false)
  const [suggestedFor, setSuggestedFor] = useState<SportId | null>(null)
  const suggestFor = (sportId: string) => {
    if (formatTouched) return
    const name = sportCategories.find((c) => c.id === sportId)?.name ?? sportId
    const { format, config } = suggestFormat(name)
    setFormatState((prev) => ({
      ...prev,
      format,
      scoreKind: config.scoreKind ?? prev.scoreKind,
      leaderboardRounds: config.leaderboardRounds ? String(config.leaderboardRounds) : prev.leaderboardRounds,
    }))
    const known = sportCategories.find((cat) => cat.id === sportId)
    setSuggestedFor(known && known.id !== 'other' ? known.id : null)
  }

  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    category: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    description: '',
    rules: '',
    requirements: '',
    prizePool: '',
    entryFee: '',
  })

  const applyPreset = (preset: typeof PRESET_TEMPLATES[0]) => {
    setFormData({
      title: preset.title,
      sport: preset.sport,
      category: preset.category,
      date: preset.date,
      time: preset.time,
      location: preset.location,
      maxParticipants: preset.maxParticipants,
      description: preset.description,
      rules: preset.rules,
      requirements: preset.requirements,
      prizePool: preset.prizePool,
      entryFee: preset.entryFee,
    })
    suggestFor(preset.sport)
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === 'sport') suggestFor(value)
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})

    const f = formatState
    const result = await createTournament({
      ...formData,
      // Store the display name ("Football"), the same vocabulary the feed
      // filters and the leaderboard's game filter use.
      sport: sportCategories.find((c) => c.id === formData.sport)?.name ?? formData.sport,
      format: f.format,
      participantType: f.participantType,
      teamSize: f.participantType === 'TEAM' ? f.teamSize : '',
      teamSizeMax: f.participantType === 'TEAM' ? f.teamSizeMax : '',
      formatConfig: {
        seeding: f.seeding,
        thirdPlaceMatch: f.thirdPlaceMatch,
        grandFinalReset: f.grandFinalReset,
        groupCount: f.groupCount,
        advancePerGroup: f.advancePerGroup,
        swissRounds: f.swissRounds,
        winPoints: f.winPoints,
        drawPoints: f.drawPoints,
        scoreKind: f.scoreKind,
        leaderboardRounds: f.leaderboardRounds,
      },
      posterMediaId: poster?.id ?? '',
      galleryMediaIds: gallery.flatMap((image) => (image ? [image.id] : [])),
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      toast.error(result.error)
      return
    }

    toast.success(c.created)
    router.push(`/tournament/${result.data.tournamentId}`)
  }

  const categoryIcons = {
    sports: Dribbble,
    esports: Gamepad2,
    academic: GraduationCap,
  }

  return (
    <div className="container mx-auto px-4 py-6 theme-create bg-background text-foreground">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">{c.title}</h1>
          <p className="text-muted-foreground mt-1">
            {c.subtitle}
          </p>

          {/* Quick Fill Real Examples */}
          <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                {c.quick_fill}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <Button
                  key={tmpl.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(tmpl)}
                  className="text-xs font-medium border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {c.presets[tmpl.key]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {c.basic_info}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">{c.tournament_title}</FieldLabel>
                    <Input
                      id="title"
                      placeholder={c.title_placeholder}
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="sport">{c.sport_game}</FieldLabel>
                      <Select value={formData.sport} onValueChange={(v) => handleChange('sport', v)}>
                        <SelectTrigger id="sport">
                          <SelectValue placeholder={c.select_sport} />
                        </SelectTrigger>
                        <SelectContent>
                          {sportCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {c.sports[category.id]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="category">{c.category}</FieldLabel>
                      <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder={c.select_category} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sports">{c.categories.sports}</SelectItem>
                          <SelectItem value="esports">{c.categories.esports}</SelectItem>
                          <SelectItem value="academic">{c.categories.academic}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Date & Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {c.date_location}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="date">{c.start_date}</FieldLabel>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="time">{c.start_time}</FieldLabel>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="location">{c.location}</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        className="pl-10"
                        placeholder={c.location_placeholder}
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                      />
                    </div>
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Participants & Prizes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {c.participants_prizes}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="maxParticipants">{c.max_participants}</FieldLabel>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder={c.max_participants_placeholder}
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="prizePool">{c.prize_pool}</FieldLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="prizePool"
                          className="pl-10"
                          placeholder={c.prize_pool_placeholder}
                          value={formData.prizePool}
                          onChange={(e) => handleChange('prizePool', e.target.value)}
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="entryFee">{c.entry_fee}</FieldLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="entryFee"
                          className="pl-10"
                          placeholder={c.entry_fee_placeholder}
                          value={formData.entryFee}
                          onChange={(e) => handleChange('entryFee', e.target.value)}
                        />
                      </div>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Competition Format */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {c.competition_format}
                </CardTitle>
                <CardDescription>
                  {c.competition_format_desc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="format">{c.format}</FieldLabel>
                      <Select
                        value={formatState.format}
                        onValueChange={(v) => {
                          setFormatTouched(true)
                          setFormat('format', v as TournamentFormat)
                        }}
                      >
                        <SelectTrigger id="format" className="w-full min-w-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TOURNAMENT_FORMATS.map((format) => (
                            <SelectItem key={format} value={format}>
                              {c.formats[format].label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="participantType">{c.participants}</FieldLabel>
                      <Select
                        value={formatState.participantType}
                        onValueChange={(v) => setFormat('participantType', v as FormatState['participantType'])}
                      >
                        <SelectTrigger id="participantType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INDIVIDUAL">{c.individual}</SelectItem>
                          <SelectItem value="TEAM">{c.teams}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c.formats[formatState.format].hint}
                    {suggestedFor && !formatTouched ? (
                      <span className="text-primary">{c.recommended_for(c.sports[suggestedFor])}</span>
                    ) : null}
                  </p>

                  {formatState.format === 'LEADERBOARD' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="scoreKind">{c.ranked_by}</FieldLabel>
                        <Select
                          value={formatState.scoreKind}
                          onValueChange={(v) => setFormat('scoreKind', v as FormatState['scoreKind'])}
                        >
                          <SelectTrigger id="scoreKind">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="time">{c.rank_time}</SelectItem>
                            <SelectItem value="points">{c.rank_points}</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="leaderboardRounds">{c.rounds_heats}</FieldLabel>
                        <Input
                          id="leaderboardRounds"
                          type="number"
                          min={1}
                          max={20}
                          value={formatState.leaderboardRounds}
                          onChange={(e) => setFormat('leaderboardRounds', e.target.value)}
                        />
                      </Field>
                    </div>
                  ) : null}

                  {formatState.participantType === 'TEAM' ? (
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="teamSize">{c.roster_min}</FieldLabel>
                        <Input
                          id="teamSize"
                          type="number"
                          min={1}
                          placeholder={c.roster_min_placeholder}
                          value={formatState.teamSize}
                          onChange={(e) => setFormat('teamSize', e.target.value)}
                        />
                        {errors.teamSize ? <p className="text-xs text-destructive">{errors.teamSize}</p> : null}
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="teamSizeMax">{c.roster_max}</FieldLabel>
                        <Input
                          id="teamSizeMax"
                          type="number"
                          min={1}
                          placeholder={c.roster_max_placeholder}
                          value={formatState.teamSizeMax}
                          onChange={(e) => setFormat('teamSizeMax', e.target.value)}
                        />
                        {errors.teamSizeMax ? <p className="text-xs text-destructive">{errors.teamSizeMax}</p> : null}
                      </Field>
                    </div>
                  ) : null}

                  <div className={cn('grid sm:grid-cols-2 gap-4', formatState.format === 'LEADERBOARD' && 'hidden')}>
                    <Field>
                      <FieldLabel htmlFor="seeding">{c.draw}</FieldLabel>
                      <Select value={formatState.seeding} onValueChange={(v) => setFormat('seeding', v as FormatState['seeding'])}>
                        <SelectTrigger id="seeding">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="random">{c.random_draw}</SelectItem>
                          <SelectItem value="seeded">{c.seeded_draw}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {formatState.format === 'GROUPS_KNOCKOUT' ? (
                      <Field>
                        <FieldLabel htmlFor="groupCount">{c.group_count}</FieldLabel>
                        <Input
                          id="groupCount"
                          type="number"
                          min={1}
                          placeholder={c.group_count_placeholder}
                          value={formatState.groupCount}
                          onChange={(e) => setFormat('groupCount', e.target.value)}
                        />
                      </Field>
                    ) : null}

                    {formatState.format === 'SWISS' ? (
                      <Field>
                        <FieldLabel htmlFor="swissRounds">{c.swiss_rounds}</FieldLabel>
                        <Input
                          id="swissRounds"
                          type="number"
                          min={1}
                          placeholder={c.swiss_rounds_placeholder}
                          value={formatState.swissRounds}
                          onChange={(e) => setFormat('swissRounds', e.target.value)}
                        />
                      </Field>
                    ) : null}
                  </div>

                  {formatState.format === 'GROUPS_KNOCKOUT' ? (
                    <Field>
                      <FieldLabel htmlFor="advancePerGroup">{c.advance_per_group}</FieldLabel>
                      <Input
                        id="advancePerGroup"
                        type="number"
                        min={1}
                        value={formatState.advancePerGroup}
                        onChange={(e) => setFormat('advancePerGroup', e.target.value)}
                      />
                    </Field>
                  ) : null}

                  {['ROUND_ROBIN', 'GROUPS_KNOCKOUT', 'SWISS'].includes(formatState.format) ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="winPoints">{c.win_points}</FieldLabel>
                        <Input
                          id="winPoints"
                          type="number"
                          min={0}
                          step="0.5"
                          value={formatState.winPoints}
                          onChange={(e) => setFormat('winPoints', e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="drawPoints">{c.draw_points}</FieldLabel>
                        <Input
                          id="drawPoints"
                          type="number"
                          min={0}
                          step="0.5"
                          value={formatState.drawPoints}
                          onChange={(e) => setFormat('drawPoints', e.target.value)}
                        />
                      </Field>
                    </div>
                  ) : null}

                  {formatState.format === 'SINGLE_ELIMINATION' || formatState.format === 'GROUPS_KNOCKOUT' ? (
                    <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                      <span>
                        <span className="block text-sm font-medium">{c.third_place}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.third_place_hint}
                        </span>
                      </span>
                      <Switch
                        checked={formatState.thirdPlaceMatch}
                        onCheckedChange={(v) => setFormat('thirdPlaceMatch', v)}
                      />
                    </label>
                  ) : null}

                  {formatState.format === 'DOUBLE_ELIMINATION' ? (
                    <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                      <span>
                        <span className="block text-sm font-medium">{c.grand_final_reset}</span>
                        <span className="block text-xs text-muted-foreground">
                          {c.grand_final_reset_hint}
                        </span>
                      </span>
                      <Switch
                        checked={formatState.grandFinalReset}
                        onCheckedChange={(v) => setFormat('grandFinalReset', v)}
                      />
                    </label>
                  ) : null}
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {c.details}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="description">{c.description}</FieldLabel>
                    <Textarea
                      id="description"
                      placeholder={c.description_placeholder}
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="rules">{c.rules}</FieldLabel>
                    <Textarea
                      id="rules"
                      placeholder={c.rules_placeholder}
                      rows={4}
                      value={formData.rules}
                      onChange={(e) => handleChange('rules', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {c.rules_hint}
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="requirements">{c.requirements}</FieldLabel>
                    <Textarea
                      id="requirements"
                      placeholder={c.requirements_placeholder}
                      rows={3}
                      value={formData.requirements}
                      onChange={(e) => handleChange('requirements', e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Poster Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  {c.poster}
                </CardTitle>
                <CardDescription>
                  {c.poster_desc}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  value={poster}
                  onChange={setPoster}
                  label={c.poster_label}
                  hint={c.poster_hint}
                />
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{c.extra_posters}</p>
                    <p className="text-xs text-muted-foreground">{c.extra_posters_hint}</p>
                  </div>
                  {gallery.map((image, index) => (
                    <ImageUploader
                      key={image?.id ?? `draft-${index}`}
                      value={image}
                      onChange={(next) => setGallery((items) => next ? items.map((item, itemIndex) => itemIndex === index ? next : item) : items.filter((_, itemIndex) => itemIndex !== index))}
                      label={c.extra_poster(index + 1)}
                      hint={c.extra_poster_hint}
                    />
                  ))}
                  {gallery.length < 4 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setGallery((items) => [...items, null])}>
                      {c.add_image}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            {/* Validation summary — zod messages from the server action */}
            {Object.keys(errors).length > 0 ? (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <p className="mb-1 font-semibold">{c.fix_errors}</p>
                <ul className="list-inside list-disc space-y-0.5 text-xs">
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button className="gap-2" onClick={handleSubmit} disabled={isSubmitting}>
                <Trophy className="h-4 w-4" />
                {isSubmitting ? c.creating : c.submit}
              </Button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4" />
                    {c.preview}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Preview Card */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="h-32 bg-gradient-to-br from-primary/30 via-secondary to-accent/30 relative">
                      {formData.category && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {(() => {
                            const Icon = categoryIcons[formData.category as keyof typeof categoryIcons] || Trophy
                            return <Icon className="h-12 w-12 text-primary/30" />
                          })()}
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2 bg-primary">
                        {c.preview_registration}
                      </Badge>
                      {formData.sport && (
                        <Badge variant="secondary" className="absolute bottom-2 left-2">
                          {c.sports[formData.sport as SportId] ?? formData.sport}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {formData.title || c.preview_title}
                      </h3>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {formData.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(formData.date, locale)}
                            {formData.time && c.preview_at(formatClock(formData.time, locale))}
                          </div>
                        )}
                        {formData.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {formData.location}
                          </div>
                        )}
                        {formData.maxParticipants && (
                          <div className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            {c.preview_participants(formData.maxParticipants)}
                          </div>
                        )}
                      </div>
                      {(formData.prizePool || formData.entryFee) && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex justify-between text-sm">
                            {formData.prizePool && (
                              <div>
                                <p className="text-xs text-muted-foreground">{c.preview_prize}</p>
                                <p className="font-bold text-primary">${formData.prizePool}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">{c.preview_entry}</p>
                              <p className="font-semibold">
                                {formData.entryFee ? `$${formData.entryFee}` : c.preview_free}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {c.preview_hint}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

