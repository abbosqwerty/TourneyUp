'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface LoadingAnimationProps {
  className?: string
  size?: number | string
  loop?: boolean
  autoplay?: boolean
}

export function LoadingAnimation({
  className,
  size = 120,
  loop = true,
  autoplay = true,
}: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let anim: import('lottie-web').AnimationItem | null = null
    let isMounted = true

    import('lottie-web').then((lottieModule) => {
      const lottie = lottieModule.default || lottieModule
      if (!isMounted || !containerRef.current) return

      anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop,
        autoplay,
        path: '/loading.json',
      })
    })

    return () => {
      isMounted = false
      if (anim) {
        anim.destroy()
      }
    }
  }, [loop, autoplay])

  const style = typeof size === 'number' ? { width: size, height: size } : { width: size, height: size }

  return (
    <div
      ref={containerRef}
      style={style}
      className={cn('inline-flex items-center justify-center pointer-events-none', className)}
      aria-label="Loading"
      role="status"
    />
  )
}
