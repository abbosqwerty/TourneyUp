import Link from 'next/link'
import { LogoIcon } from '@/components/logo-icon'

/**
 * Shared frame for /login, /register and /organizations/apply.
 * Uses design tokens only, so it reads correctly in light and dark mode.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute left-[-20%] top-[-20%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-accent/10 blur-[120px]" />

      <div className={`relative z-10 w-full space-y-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link
            href="/"
            className="flex h-12 w-12 items-center justify-center rounded-xl transition-transform hover:scale-105"
            aria-label="Bosh sahifaga qaytish"
          >
            <LogoIcon className="h-12 w-12" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tourney<span className="text-primary">Up</span>
          </h1>
          <div className="space-y-1">
            <p className="text-lg font-semibold text-foreground">{title}</p>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
        </div>

        {children}

        {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
      </div>
    </div>
  )
}
