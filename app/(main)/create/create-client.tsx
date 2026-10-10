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
]

const PRESET_TEMPLATES = [
  {
    name: '⚽ Football Cup',
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
    name: '🎮 Valorant Masters',
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
    name: '♟️ Chess Grand Prix',
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
    name: '🏀 3v3 Streetball',
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [poster, setPoster] = useState<UploadedImage | null>(null)
  const [gallery, setGallery] = useState<(UploadedImage | null)[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

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
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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

    const result = await createTournament({
      ...formData,
      posterMediaId: poster?.id ?? '',
      galleryMediaIds: gallery.flatMap((image) => (image ? [image.id] : [])),
    })
    setIsSubmitting(false)

    if (!result.ok) {
      setErrors(result.fieldErrors ?? {})
      toast.error(result.error)
      return
    }

    toast.success('Turnir yaratildi')
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
          <h1 className="text-2xl md:text-3xl font-bold">Create Tournament</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new tournament and start accepting registrations
          </p>

          {/* Quick Fill Real Examples */}
          <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Quick Fill Real Examples
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((tmpl) => (
                <Button
                  key={tmpl.name}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(tmpl)}
                  className="text-xs font-medium border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  {tmpl.name}
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
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="title">Tournament Title</FieldLabel>
                    <Input
                      id="title"
                      placeholder="e.g., Tashkent Inter-University Football Cup"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="sport">Sport / Game</FieldLabel>
                      <Select value={formData.sport} onValueChange={(v) => handleChange('sport', v)}>
                        <SelectTrigger id="sport">
                          <SelectValue placeholder="Select sport" />
                        </SelectTrigger>
                        <SelectContent>
                          {sportCategories.filter(c => c.id !== 'all').map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="category">Category</FieldLabel>
                      <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sports">Sports</SelectItem>
                          <SelectItem value="esports">Esports</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
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
                  Date & Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="date">Start Date</FieldLabel>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="time">Start Time</FieldLabel>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => handleChange('time', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="location">Location</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        className="pl-10"
                        placeholder="e.g., Pakhtakor Central Stadium, Tashkent or 'Online'"
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
                  Participants & Prizes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="maxParticipants">Maximum Participants</FieldLabel>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder="e.g., 32"
                      value={formData.maxParticipants}
                      onChange={(e) => handleChange('maxParticipants', e.target.value)}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="prizePool">Prize Pool</FieldLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="prizePool"
                          className="pl-10"
                          placeholder="e.g., 20,000,000 UZS or $1,500"
                          value={formData.prizePool}
                          onChange={(e) => handleChange('prizePool', e.target.value)}
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="entryFee">Entry Fee</FieldLabel>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="entryFee"
                          className="pl-10"
                          placeholder="e.g., 100,000 UZS (or leave empty for free)"
                          value={formData.entryFee}
                          onChange={(e) => handleChange('entryFee', e.target.value)}
                        />
                      </div>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Tournament Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="description">Description</FieldLabel>
                    <Textarea
                      id="description"
                      placeholder="Describe your tournament, what makes it special, and what participants can expect..."
                      rows={4}
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="rules">Rules</FieldLabel>
                    <Textarea
                      id="rules"
                      placeholder="Enter tournament rules (one per line)"
                      rows={4}
                      value={formData.rules}
                      onChange={(e) => handleChange('rules', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter each rule on a new line
                    </p>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="requirements">Requirements</FieldLabel>
                    <Textarea
                      id="requirements"
                      placeholder="Enter participation requirements (one per line)"
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
                  Tournament Poster
                </CardTitle>
                <CardDescription>
                  Upload an eye-catching poster for your tournament
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  value={poster}
                  onChange={setPoster}
                  label="Rasmni tanlang yoki shu yerga tashlang"
                  hint="PNG, JPG, WebP — maksimal 4 MB. Tavsiya: 1200×630px"
                />
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Qo‘shimcha posterlar (ixtiyoriy)</p>
                    <p className="text-xs text-muted-foreground">Feed kartasida Instagram kabi slayd bo‘ladi. Detail sahifada faqat asosiy poster ko‘rinadi.</p>
                  </div>
                  {gallery.map((image, index) => (
                    <ImageUploader
                      key={image?.id ?? `draft-${index}`}
                      value={image}
                      onChange={(next) => setGallery((items) => next ? items.map((item, itemIndex) => itemIndex === index ? next : item) : items.filter((_, itemIndex) => itemIndex !== index))}
                      label={`Qo‘shimcha poster ${index + 1}`}
                      hint="PNG, JPG yoki WebP — maksimal 4 MB"
                    />
                  ))}
                  {gallery.length < 4 ? (
                    <Button type="button" variant="outline" size="sm" onClick={() => setGallery((items) => [...items, null])}>
                      Qo‘shimcha rasm qo‘shish
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
                <p className="mb-1 font-semibold">Quyidagilarni to‘g‘rilang:</p>
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
                {isSubmitting ? 'Creating...' : 'Create Tournament'}
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
                    Live Preview
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
                        Registration Open
                      </Badge>
                      {formData.sport && (
                        <Badge variant="secondary" className="absolute bottom-2 left-2">
                          {sportCategories.find(c => c.id === formData.sport)?.name || formData.sport}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {formData.title || 'Tournament Title'}
                      </h3>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        {formData.date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(formData.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {formData.time && ` at ${formData.time}`}
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
                            0/{formData.maxParticipants} participants
                          </div>
                        )}
                      </div>
                      {(formData.prizePool || formData.entryFee) && (
                        <>
                          <Separator className="my-3" />
                          <div className="flex justify-between text-sm">
                            {formData.prizePool && (
                              <div>
                                <p className="text-xs text-muted-foreground">Prize</p>
                                <p className="font-bold text-primary">${formData.prizePool}</p>
                              </div>
                            )}
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Entry</p>
                              <p className="font-semibold">
                                {formData.entryFee ? `$${formData.entryFee}` : 'Free'}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center mt-4">
                    This is how your tournament will appear in the feed
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

