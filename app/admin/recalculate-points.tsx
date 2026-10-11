'use client'

import { useTransition } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { recalculatePoints } from '@/lib/points/actions'
import { useLanguage } from '@/lib/i18n/language-context'

export function RecalculatePointsButton() {
  const [isPending, startTransition] = useTransition()
  const { dict } = useLanguage()
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
          toast.success(dict.admin.overview.recalculated(result.data.tournaments, result.data.changed))
        })
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
      {dict.admin.overview.recalculate}
    </Button>
  )
}
