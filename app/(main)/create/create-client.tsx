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
  Save,
  Gamepad2,
  Dribbble,
  GraduationCap
} from 'lucide-react'
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

export default function CreateTournamentClient() {
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await createTournament(formData)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }


  const categoryIcons = {
    sports: Dribbble,
    esports: Gamepad2,
    academic: GraduationCap,
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Create Tournament</h1>
          <p className="text-muted-foreground mt-1">
            Set up a new tournament and start accepting registrations
          </p>
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
                      placeholder="e.g., Inter-University Football Championship"
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
                        placeholder="e.g., Stanford Stadium, CA or 'Online'"
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
                          placeholder="e.g., 5,000"
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
                          placeholder="e.g., 50 (or leave empty for free)"
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
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG up to 10MB. Recommended: 1200x630px
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button variant="outline" className="gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
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
