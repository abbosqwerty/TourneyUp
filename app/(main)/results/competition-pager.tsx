'use client'

import { Pager } from '@/components/pager'

/** Pager links that keep the current filters (functions cannot cross the server boundary). */
export function CompetitionPager({ page, pageCount, query }: { page: number; pageCount: number; query: Record<string, string> }) {
  return (
    <Pager
      page={page}
      pageCount={pageCount}
      hrefFor={(next) => {
        const params = new URLSearchParams(query)
        if (next > 1) params.set('page', String(next))
        const qs = params.toString()
        return `/results${qs ? `?${qs}` : ''}`
      }}
    />
  )
}
