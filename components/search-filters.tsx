'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Loader2, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { ALL_LOCATIONS, locationOptions, sportCategories } from '@/lib/constants'
import {
  filtersToQuery,
  hasActiveFilters,
  dateRanges,
  locationFilterLabel,
  sportFilterLabel,
  type DateRange,
  type TournamentFilters,
} from '@/lib/tournament-filters'
import { useLanguage } from '@/lib/i18n/language-context'
import type { TournamentStatusValue } from '@/lib/types'

const statusValues = ['all', 'registration_open', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const

const SEARCH_DEBOUNCE_MS = 300

/**
 * Every control writes to the URL; the server component re-queries from
 * `searchParams`. No filtering happens in the browser, so the result is
 * shareable, survives a refresh and works with pagination.
 */
export function SearchFilters({ filters }: { filters: TournamentFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const { dict } = useLanguage()
  const f = dict.tournament.filters
  const statusOptions = statusValues.map((value) => ({
    value,
    label: value === 'all' ? f.all_statuses : dict.status[value as TournamentStatusValue],
  }))
  const dateRangeOptions = dateRanges.map((value) => ({ value, label: f.dates[value] }))
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(filters.q)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const typedRef = useRef(false)

  // Keep the box in sync when the URL changes from elsewhere (back button).
  useEffect(() => {
    if (!typedRef.current) setSearchQuery(filters.q)
  }, [filters.q])

  const push = (next: Partial<TournamentFilters>) => {
    // Any filter change resets to page 1 — page 7 of the old result set is
    // meaningless against a new one.
    const query = filtersToQuery({ ...filters, ...next, page: 1 })
    startTransition(() => router.replace(`${pathname}${query}`, { scroll: false }))
  }

  // Debounce the query string so typing does not fire a request per keystroke.
  useEffect(() => {
    if (!typedRef.current) return
    const timer = setTimeout(() => {
      typedRef.current = false
      push({ q: searchQuery })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const onType = (value: string) => {
    typedRef.current = true
    setSearchQuery(value)
  }

  const activeCount = [
    filters.sport !== 'all',
    filters.location !== ALL_LOCATIONS,
    filters.status !== 'all',
    filters.dateRange !== 'all',
  ].filter(Boolean).length

  const clearFilters = () => {
    typedRef.current = false
    setSearchQuery('')
    startTransition(() => router.replace(pathname, { scroll: false }))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label={f.search_label}
            placeholder={dict.feed.search_placeholder}
            className="pl-10"
            value={searchQuery}
            onChange={(event) => onType(event.target.value)}
          />
          {isPending ? (
            <Loader2
              className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
        </div>

        <div className="hidden gap-2 md:flex">
          <Select value={filters.sport} onValueChange={(v) => push({ sport: v })}>
            <SelectTrigger className="w-40" aria-label={f.sport_type}>
              <SelectValue placeholder={f.sport} />
            </SelectTrigger>
            <SelectContent>
              {sportCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {sportFilterLabel(dict, category.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.location} onValueChange={(v) => push({ location: v })}>
            <SelectTrigger className="w-44" aria-label={f.location}>
              <MapPin className="mr-2 h-4 w-4" aria-hidden />
              <SelectValue placeholder={f.location} />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {locationFilterLabel(dict, option.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(v) => push({ status: v })}>
            <SelectTrigger className="w-44" aria-label={f.status}>
              <SelectValue placeholder={f.status} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative md:hidden" aria-label={f.filters}>
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
              {activeCount > 0 && (
                <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-xs">
                  {activeCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{f.filters}</SheetTitle>
              <SheetDescription>{f.sheet_description}</SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-6 px-4 pb-8">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="filter-sport">
                  {f.sport}
                </label>
                <Select value={filters.sport} onValueChange={(v) => push({ sport: v })}>
                  <SelectTrigger id="filter-sport">
                    <SelectValue placeholder={f.choose_sport} />
                  </SelectTrigger>
                  <SelectContent>
                    {sportCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {sportFilterLabel(dict, category.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="filter-location">
                  {f.location}
                </label>
                <Select value={filters.location} onValueChange={(v) => push({ location: v })}>
                  <SelectTrigger id="filter-location">
                    <SelectValue placeholder={f.choose_location} />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {locationFilterLabel(dict, option.value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="filter-status">
                  {f.status}
                </label>
                <Select value={filters.status} onValueChange={(v) => push({ status: v })}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder={f.choose_status} />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="filter-date">
                  {f.date}
                </label>
                <Select
                  value={filters.dateRange}
                  onValueChange={(v) => push({ dateRange: v as DateRange })}
                >
                  <SelectTrigger id="filter-date">
                    <SelectValue placeholder={f.date_range} />
                  </SelectTrigger>
                  <SelectContent>
                    {dateRangeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  {f.clear}
                </Button>
                <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                  {f.apply}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {hasActiveFilters(filters) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">{f.active}</span>
          {filters.q ? <FilterChip label={`“${filters.q}”`} onClear={() => { typedRef.current = false; setSearchQuery(''); push({ q: '' }) }} /> : null}
          {filters.sport !== 'all' ? (
            <FilterChip
              label={sportFilterLabel(dict, filters.sport)}
              onClear={() => push({ sport: 'all' })}
            />
          ) : null}
          {filters.location !== ALL_LOCATIONS ? (
            <FilterChip
              label={locationFilterLabel(dict, filters.location)}
              onClear={() => push({ location: ALL_LOCATIONS })}
            />
          ) : null}
          {filters.status !== 'all' ? (
            <FilterChip
              label={statusOptions.find((o) => o.value === filters.status)?.label ?? filters.status}
              onClear={() => push({ status: 'all' })}
            />
          ) : null}
          {filters.dateRange !== 'all' ? (
            <FilterChip
              label={dateRangeOptions.find((o) => o.value === filters.dateRange)?.label ?? ''}
              onClear={() => push({ dateRange: 'all' })}
            />
          ) : null}
          <Button variant="ghost" size="sm" className="text-xs" onClick={clearFilters}>
            {f.clear_all}
          </Button>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  const { dict } = useLanguage()
  return (
    <Badge variant="secondary" className="gap-1 pr-1">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={dict.tournament.filters.remove(label)}
        className="rounded-sm p-0.5 hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </Badge>
  )
}

/** Horizontal sport chips used on narrow screens. */
export function SportCategoryTabs({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (id: string) => void
}) {
  const { dict } = useLanguage()
  return (
    <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
      {sportCategories.map((category) => (
        <Button
          key={category.id}
          variant={selected === category.id ? 'default' : 'outline'}
          size="sm"
          className={cn('flex-shrink-0', selected === category.id && 'glow-primary')}
          onClick={() => onSelect(category.id)}
        >
          {sportFilterLabel(dict, category.id)}
        </Button>
      ))}
    </div>
  )
}
