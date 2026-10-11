import Image from 'next/image'
import { cn } from '@/lib/utils'

/**
 * TourneyUp official logo mark.
 * Matches the official branding across navbar, footer, auth and modals.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden aspect-square shrink-0',
        className
      )}
      aria-hidden="true"
    >
      <Image
        src="/logo.png"
        alt="TourneyUp logo"
        width={64}
        height={64}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  )
}
