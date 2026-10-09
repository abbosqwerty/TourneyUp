'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { StoryViewer } from './story-viewer'

export type StoryGroupProps = {
  organizationId: string
  organizationName: string
  organizationSlug: string
  avatar: string | null
  hasUnseen: boolean
  stories: {
    id: string
    mediaUrl: string
    caption: string | null
    createdAt: string
    seen: boolean
    tournament: { id: string; title: string } | null
  }[]
}

/**
 * Instagram-style ring of organization stories. Unwatched groups keep the
 * gradient ring; watched ones fade to a plain border.
 */
export function StoriesBar({ groups }: { groups: StoryGroupProps[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (groups.length === 0) return null

  return (
    <>
      <div className="scrollbar-hide -mx-4 mb-6 flex gap-4 overflow-x-auto px-4 pb-2">
        {groups.map((group, index) => (
          <button
            key={group.organizationId}
            type="button"
            onClick={() => setOpenIndex(index)}
            className="flex w-[72px] shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <span
              className={cn(
                'rounded-full p-[2px]',
                group.hasUnseen
                  ? 'bg-gradient-to-tr from-primary via-accent to-primary'
                  : 'bg-border'
              )}
            >
              <span className="block rounded-full bg-background p-[2px]">
                {group.avatar ? (
                   
                  <img
                    src={group.avatar}
                    alt={`${group.organizationName} story`}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {group.organizationName.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </span>
            </span>
            <span className="w-full truncate text-center text-[11px] text-muted-foreground">
              {group.organizationName}
            </span>
          </button>
        ))}
      </div>

      {openIndex !== null ? (
        <StoryViewer
          groups={groups}
          startIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </>
  )
}
