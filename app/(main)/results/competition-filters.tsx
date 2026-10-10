'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COMPETITION_TABS, type CompetitionTab } from '@/lib/competition/list'

const SEARCH_DEBOUNCE_MS = 300

/** Filters write to the URL; the server page re-queries. */
export function CompetitionFilters({ tab, query, category }: { tab: CompetitionTab; query: string; category: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState(query)

  const hrefFor = (next: { tab?: CompetitionTab; q?: string; category?: string }) => {
    const params = new URLSearchParams()
    const t = next.tab ?? tab
    const q = next.q ?? query
    const c = next.category ?? category
    if (t !== 'all') params.set('tab', t)
    if (q) params.set('q', q)
    if (c) params.set('category', c)
    const qs = params.toString()
    return `${pathname}${qs ? `?${qs}` : ''}`
  }

  useEffect(() => {
    if (text.trim() === query) return
    const timer = setTimeout(() => {
      startTransition(() => router.replace(hrefFor({ q: text.trim() })))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Turnir nomi bo‘yicha qidirish"
            className="pl-9"
            aria-label="Turnir qidirish"
          />
          {isPending ? (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
        </div>
        <Select
          value={category || 'all'}
          onValueChange={(value) =>
            startTransition(() => router.replace(hrefFor({ category: value === 'all' ? '' : value })))
          }
        >
          <SelectTrigger className="w-full sm:w-44" aria-label="Kategoriya">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Barcha kategoriyalar</SelectItem>
            <SelectItem value="sports">Sport</SelectItem>
            <SelectItem value="esports">Kibersport</SelectItem>
            <SelectItem value="academic">Akademik</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-1" aria-label="Turnir holati">
        {(Object.keys(COMPETITION_TABS) as CompetitionTab[]).map((key) => (
          <Button key={key} asChild size="sm" variant={key === tab ? 'default' : 'ghost'} className="flex-1 whitespace-nowrap">
            <Link href={hrefFor({ tab: key })} aria-current={key === tab ? 'page' : undefined}>
              {COMPETITION_TABS[key].label}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}
