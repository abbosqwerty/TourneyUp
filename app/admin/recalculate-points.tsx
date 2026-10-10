'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { recalculatePoints } from '@/lib/points/actions'

export function RecalculatePointsButton() {
  const [isPending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await recalculatePoints()
          if (!result.ok) return void toast.error(result.error)
          toast.success(`${result.data.tournaments} ta turnir tekshirildi, ${result.data.changed} ta yozuv yangilandi`)
        })
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
      Ballarni qayta hisoblash
    </Button>
  )
}
