'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Re-fetch the server components on an interval while the tab is visible.
 * Stands in for a websocket: the app runs on serverless functions, which
 * cannot hold one open.
 */
export function AutoRefresh({ intervalMs = 8000 }: { intervalMs?: number }) {
  const router = useRouter()
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const id = window.setInterval(tick, intervalMs)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [router, intervalMs])
  return null
}
