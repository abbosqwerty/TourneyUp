'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth-actions'

/**
 * Signs out via a server action and refreshes the router — no
 * `window.location.reload()`, so client navigation stays intact.
 */
export function LogoutButton({
  variant = 'outline',
  size = 'sm',
  className,
  withLabel = true,
}: {
  variant?: 'outline' | 'ghost' | 'default' | 'destructive'
  size?: 'sm' | 'default' | 'icon'
  className?: string
  withLabel?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      aria-label="Tizimdan chiqish"
      onClick={() =>
        startTransition(async () => {
          const result = await logout()
          if (!result.ok) {
            toast.error(result.error)
            return
          }
          router.replace('/')
          router.refresh()
        })
      }
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      {withLabel ? <span className={size === 'icon' ? 'sr-only' : 'ml-1'}>Chiqish</span> : null}
    </Button>
  )
}
