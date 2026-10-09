'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { markAllNotificationsRead } from '@/lib/notification-actions'

export function MarkAllReadButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead()
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          router.refresh()
        })
      }
    >
      <Check className="h-4 w-4" aria-hidden />
      Hammasini o‘qildi
    </Button>
  )
}
