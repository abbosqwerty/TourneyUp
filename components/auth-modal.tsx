'use client'

import React, { createContext, useCallback, useContext, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, LogIn, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LogoIcon } from '@/components/logo-icon'

export type AuthModalUser = {
  id: string
  name: string
  username: string
  avatar: string
  role: 'USER' | 'ORGANIZATION' | 'SUPER_ADMIN'
}

interface AuthModalOptions {
  title?: string
  description?: string
  /** Where to land after signing in; defaults to the current path. */
  redirectTo?: string
}

interface AuthModalContextType {
  openLoginModal: (options?: AuthModalOptions) => void
  closeLoginModal: () => void
  currentUser: AuthModalUser | null
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

/**
 * Prompts a guest to sign in before a gated action. It no longer performs
 * the login itself — authentication lives on /login so there is exactly one
 * credential path.
 */
export function AuthModalProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: AuthModalUser | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AuthModalOptions>({})
  const router = useRouter()
  const pathname = usePathname()

  const openLoginModal = useCallback((opts?: AuthModalOptions) => {
    setOptions(opts ?? {})
    setIsOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => setIsOpen(false), [])

  const target = options.redirectTo ?? pathname ?? '/feed'
  const goTo = (path: '/login' | '/register') => {
    setIsOpen(false)
    router.push(`${path}?next=${encodeURIComponent(target)}`)
  }

  return (
    <AuthModalContext.Provider value={{ openLoginModal, closeLoginModal, currentUser: initialUser }}>
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center gap-2">
              <LogoIcon className="h-9 w-9 text-primary" />
              <span className="text-xl font-bold tracking-tight">
                Tourney<span className="text-primary">Up</span>
              </span>
            </div>
            <DialogTitle className="text-xl font-bold">{options.title ?? 'Davom etish uchun kiring'}</DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {options.description ??
                'Turnirlarga yozilish, kanallarga obuna bo‘lish va tadbirlarni saqlash uchun akkaunt kerak.'}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full gap-2" onClick={() => goTo('/login')}>
              <LogIn className="h-4 w-4" aria-hidden />
              Kirish
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
            <Button variant="outline" className="w-full gap-2" onClick={() => goTo('/register')}>
              <UserPlus className="h-4 w-4" aria-hidden />
              Ro‘yxatdan o‘tish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  )
}
