'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { markStorySeen } from '@/lib/story-actions'
import type { StoryGroupProps } from './stories-bar'

const STORY_DURATION_MS = 5000

/**
 * Fullscreen story player: auto-advances, supports keyboard arrows and
 * marks each frame as seen so the ring state survives a reload.
 */
export function StoryViewer({
  groups,
  startIndex,
  onClose,
}: {
  groups: StoryGroupProps[]
  startIndex: number
  onClose: () => void
}) {
  const [groupIndex, setGroupIndex] = useState(startIndex)
  const [storyIndex, setStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const seenRef = useRef<Set<string>>(new Set())
  const touchStartX = useRef<number | null>(null)

  const group = groups[groupIndex]
  const story = group?.stories[storyIndex]
  const isVideo = story?.mediaType.startsWith('video/') ?? false

  const goNext = useCallback(() => {
    setProgress(0)
    setStoryIndex((currentStory) => {
      const current = groups[groupIndex]
      if (current && currentStory + 1 < current.stories.length) return currentStory + 1

      setGroupIndex((currentGroup) => {
        if (currentGroup + 1 < groups.length) return currentGroup + 1
        onClose()
        return currentGroup
      })
      return 0
    })
  }, [groupIndex, groups, onClose])

  const goPrev = useCallback(() => {
    setProgress(0)
    setStoryIndex((currentStory) => {
      if (currentStory > 0) return currentStory - 1

      let fallback = 0
      setGroupIndex((currentGroup) => {
        if (currentGroup > 0) {
          fallback = groups[currentGroup - 1].stories.length - 1
          return currentGroup - 1
        }
        return currentGroup
      })
      return fallback
    })
  }, [groups])

  // Images advance after five seconds. Videos advance when playback ends.
  useEffect(() => {
    if (!story || isVideo) return
    const started = Date.now()
    const tick = setInterval(() => {
      const elapsed = Date.now() - started
      setProgress(Math.min(100, (elapsed / STORY_DURATION_MS) * 100))
      if (elapsed >= STORY_DURATION_MS) goNext()
    }, 50)

    return () => clearInterval(tick)
  }, [story, goNext, isVideo])

  // Record the view once per story.
  useEffect(() => {
    if (!story || seenRef.current.has(story.id)) return
    seenRef.current.add(story.id)
    void markStorySeen(story.id)
  }, [story])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') goNext()
      if (event.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  if (!group || !story) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${group.organizationName} storylari`}
    >
      <div className="relative flex h-full w-full max-w-sm flex-col">
        <div className="mb-2 flex gap-1">
          {group.stories.map((item, index) => (
            <span key={item.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full bg-white transition-[width] duration-100"
                style={{
                  width: index < storyIndex ? '100%' : index === storyIndex ? `${progress}%` : '0%',
                }}
              />
            </span>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {group.avatar ? (
               
              <img src={group.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                {group.organizationName.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="truncate text-sm font-semibold text-white">{group.organizationName}</span>
            <span className="shrink-0 text-xs text-white/60">
              {new Date(story.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Yopish"
            className="text-white hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div
          className="relative flex-1 overflow-hidden rounded-xl bg-black"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const startX = touchStartX.current
            const endX = event.changedTouches[0]?.clientX
            touchStartX.current = null
            if (startX === null || endX === undefined) return
            if (endX - startX > 48) goPrev()
            if (startX - endX > 48) goNext()
          }}
        >
          {isVideo ? (
            <video
              key={story.id}
              src={story.mediaUrl}
              className="h-full w-full object-contain"
              autoPlay
              muted
              playsInline
              onTimeUpdate={(event) => {
                const { currentTime, duration } = event.currentTarget
                if (Number.isFinite(duration) && duration > 0) setProgress((currentTime / duration) * 100)
              }}
              onEnded={goNext}
            />
          ) : (
            <img src={story.mediaUrl} alt={story.caption ?? 'Story'} className="h-full w-full object-contain" />
          )}

          <button
            type="button"
            onClick={goPrev}
            aria-label="Oldingi story"
            className="absolute inset-y-0 left-0 w-1/3 cursor-pointer focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={goNext}
            aria-label="Keyingi story"
            className="absolute inset-y-0 right-0 w-1/3 cursor-pointer focus-visible:outline-none"
          />

          <div className="pointer-events-none absolute left-2 top-1/2 hidden -translate-y-1/2 text-white/40 sm:block">
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </div>
          <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 text-white/40 sm:block">
            <ChevronRight className="h-6 w-6" aria-hidden />
          </div>

          {story.caption || story.tournament ? (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16">
              {story.caption ? <p className="mb-3 text-sm text-white">{story.caption}</p> : null}
              {story.tournament ? (
                <Button size="sm" variant="secondary" asChild className="w-full">
                  <Link href={`/tournament/${story.tournament.id}`} onClick={onClose}>
                    {story.tournament.title} ga o‘tish
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
