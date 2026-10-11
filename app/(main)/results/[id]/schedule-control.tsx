'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { scheduleMatch } from '@/lib/match-actions'

/** ISO instant → `YYYY-MM-DDTHH:mm` in Tashkent time for a datetime-local input. */
export function toTashkentInput(iso: string | null) {
  if (!iso) return ''
  return new Date(new Date(iso).getTime() + 5 * 60 * 60 * 1000).toISOString().slice(0, 16)
}

/** Organizer-only date/time picker for one match. */
export function ScheduleControl({ matchId, scheduledAt }: { matchId: string; scheduledAt: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(toTashkentInput(scheduledAt))
  const [isPending, startTransition] = useTransition()

  const save = (next: string) => {
    startTransition(async () => {
      const result = await scheduleMatch({ matchId, scheduledAt: next })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(next ? 'Vaqt belgilandi' : 'Vaqt olib tashlandi')
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <CalendarClock className="h-4 w-4" aria-hidden />
          {scheduledAt ? 'O‘zgartirish' : 'Vaqt belgilash'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Sana va vaqt (Toshkent)</span>
          <Input type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <div className="flex justify-end gap-2">
          {scheduledAt ? (
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => save('')}>
              Olib tashlash
            </Button>
          ) : null}
          <Button size="sm" disabled={isPending || !value} onClick={() => save(value)} className="gap-2">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Saqlash
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
