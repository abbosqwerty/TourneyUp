'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { setTournamentStatus } from '@/lib/actions'

type Status = 'upcoming' | 'registration_open' | 'ongoing' | 'completed' | 'cancelled'

const OPTIONS: { value: Status; label: string }[] = [
  { value: 'upcoming', label: 'Kutilmoqda' },
  { value: 'registration_open', label: 'Ro‘yxat ochiq' },
  { value: 'ongoing', label: 'Davom etmoqda' },
  { value: 'completed', label: 'Yakunlangan' },
  { value: 'cancelled', label: 'Bekor qilingan' },
]

const CLOSING: Status[] = ['completed', 'cancelled']
const CONFIRM: Status[] = ['ongoing', ...CLOSING]

/**
 * Which statuses the organizer may pick from here. The server enforces the
 * same rules; this only hides the choices that would be refused. Once the
 * draw exists, `completed` is set automatically by the last result.
 */
function allowedOptions(current: Status, drawn: boolean) {
  return OPTIONS.filter((option) => {
    if (option.value === current) return true
    if (current === 'cancelled') return false
    if (current === 'completed') return option.value === 'cancelled'
    if (drawn) return option.value === 'cancelled'
    return option.value !== 'completed'
  })
}

/**
 * Status control with a confirmation step on the transitions that cannot be
 * undone: starting (writes the draw) and closing (revokes staff grants).
 */
export function TournamentStatusSelect({
  tournamentId,
  status,
  drawn = false,
}: {
  tournamentId: string
  status: Status
  drawn?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [current, setCurrent] = useState<Status>(status)
  const [confirming, setConfirming] = useState<Status | null>(null)

  const apply = (next: Status) => {
    const previous = current
    setCurrent(next)

    startTransition(async () => {
      const result = await setTournamentStatus({ tournamentId, status: next })
      if (!result.ok) {
        setCurrent(previous)
        toast.error(result.error)
        return
      }
      toast.success(
        next === 'ongoing'
          ? 'Turnir boshlandi — qur’a tashlandi'
          : CLOSING.includes(next)
            ? 'Turnir yopildi — vaqtinchalik ruxsatlar olib tashlandi'
            : 'Status yangilandi'
      )
      router.refresh()
    })
  }

  return (
    <>
      <Select
        value={current}
        disabled={isPending}
        onValueChange={(value) => {
          const next = value as Status
          if (next === current) return
          if (CONFIRM.includes(next)) {
            setConfirming(next)
            return
          }
          apply(next)
        }}
      >
        <SelectTrigger size="sm" className="w-[170px]" aria-label="Turnir statusi">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowedOptions(current, drawn).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirming === 'ongoing'
                ? 'Turnirni boshlash'
                : confirming === 'cancelled'
                  ? 'Turnirni bekor qilish'
                  : 'Turnirni yakunlash'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirming === 'ongoing'
                ? 'Ro‘yxatdan o‘tish yopiladi va tasdiqlangan (to‘lovi qabul qilingan) ishtirokchilar bilan qur’a avtomatik tashlanadi. Shundan keyin ishtirokchilar tarkibi va format o‘zgarmaydi.'
                : confirming === 'cancelled'
                  ? 'Barcha vaqtinchalik rollar olib tashlanadi, turnir kanali arxivlanadi va bu turnir bergan Tourney Points qaytarib olinadi.'
                  : 'Bu amal barcha vaqtinchalik rollarni (admin, organizer, support) olib tashlaydi va turnir kanalini arxivlaydi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const next = confirming
                setConfirming(null)
                if (next) apply(next)
              }}
            >
              Davom etish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
