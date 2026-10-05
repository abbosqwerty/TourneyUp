'use client'

import React, { createContext, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy, User, ArrowRight, Loader2, ShieldAlert } from 'lucide-react'
import { LogoIcon } from '@/components/logo-icon'
import { loginUser } from '@/lib/actions'

interface AuthModalOptions {
  title?: string
  description?: string
  callback?: () => void
  redirectTo?: string
}

interface AuthModalContextType {
  openLoginModal: (options?: AuthModalOptions) => void
  closeLoginModal: () => void
  currentUser: { id: string; name: string; username: string; avatar: string } | null
  setCurrentUser: React.Dispatch<React.SetStateAction<{ id: string; name: string; username: string; avatar: string } | null>>
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

export function AuthModalProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: { id: string; name: string; username: string; avatar: string } | null
}) {
  const [currentUser, setCurrentUser] = useState(initialUser)
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<AuthModalOptions>({})
  const [usernameInput, setUsernameInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const openLoginModal = (opts?: AuthModalOptions) => {
    setOptions(opts || {})
    setError('')
    setUsernameInput('')
    setIsOpen(true)
  }

  const closeLoginModal = () => {
    setIsOpen(false)
    setIsLoading(null)
    setError('')
  }

  const executePostLogin = (role: string) => {
    closeLoginModal()
    if (options.callback) {
      options.callback()
    } else if (options.redirectTo) {
      window.location.href = options.redirectTo
    } else {
      // Refresh current page to update server-rendered components with auth cookie
      window.location.reload()
    }
  }

  const handleDemoLogin = async (userId: string, role: string) => {
    setIsLoading(userId)
    setError('')
    try {
      await loginUser(userId)
      executePostLogin(role)
    } catch (err) {
      console.error(err)
      setError('Login failed. Please try again.')
      setIsLoading(null)
    }
  }

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameInput.trim()) {
      setError('Please enter a username.')
      return
    }

    const cleaned = usernameInput.trim().toLowerCase()
    let targetUserId = ''
    let role = 'player'

    if (cleaned === 'abbosq' || cleaned === 'user1') {
      targetUserId = 'user1'
      role = 'player'
    } else if (cleaned === 'tashkent_sports' || cleaned === 'org1') {
      targetUserId = 'org1'
      role = 'organizer'
    } else if (cleaned === 'nigorar' || cleaned === 'user10') {
      targetUserId = 'user10'
      role = 'player'
    } else {
      setError('Invalid username for demo. Try "abbosq" or "tashkent_sports".')
      return
    }

    setIsLoading('custom')
    setError('')
    try {
      await loginUser(targetUserId)
      executePostLogin(role)
    } catch (err) {
      console.error(err)
      setError('Login failed.')
      setIsLoading(null)
    }
  }

  return (
    <AuthModalContext.Provider
      value={{
        openLoginModal,
        closeLoginModal,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md p-6 overflow-hidden">
          <DialogHeader className="flex flex-col items-center text-center space-y-2 pb-2">
            <div className="flex items-center gap-2">
              <LogoIcon className="h-9 w-9 text-primary" />
              <span className="text-xl font-bold tracking-tight">
                Tourney<span className="text-primary">Up</span>
              </span>
            </div>
            <DialogTitle className="text-xl font-bold">
              {options.title || 'Sign In to Continue'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              {options.description || 'You need an account to join tournaments, register teams, and save events.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* Quick Demo Options */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Demo Sign In
              </p>

              {/* Player Quick Login */}
              <button
                type="button"
                onClick={() => handleDemoLogin('user1', 'player')}
                disabled={isLoading !== null}
                className="w-full p-3 rounded-lg border border-border bg-card/60 hover:bg-accent/40 hover:border-primary/50 text-left transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      Abbos Qurbonov
                    </p>
                    <p className="text-xs text-muted-foreground">Player Account</p>
                  </div>
                </div>
                {isLoading === 'user1' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Badge variant="outline" className="border-border group-hover:border-primary group-hover:text-primary transition-colors text-xs">
                    Sign In <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </button>

              {/* Organizer Quick Login */}
              <button
                type="button"
                onClick={() => handleDemoLogin('org1', 'organizer')}
                disabled={isLoading !== null}
                className="w-full p-3 rounded-lg border border-border bg-card/60 hover:bg-accent/40 hover:border-primary/50 text-left transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      Tashkent Sports Association
                    </p>
                    <p className="text-xs text-muted-foreground">Organizer Account</p>
                  </div>
                </div>
                {isLoading === 'org1' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Badge variant="outline" className="border-border group-hover:border-primary group-hover:text-primary transition-colors text-xs">
                    Sign In <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">Or enter username</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {/* Custom Username Input */}
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <Input
                placeholder="e.g., abbosq or tashkent_sports"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                disabled={isLoading !== null}
                className="text-sm"
              />

              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full"
                size="sm"
                disabled={isLoading !== null || !usernameInput.trim()}
              >
                {isLoading === 'custom' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing In...
                  </>
                ) : (
                  'Sign In with Username'
                )}
              </Button>
            </form>

            <p className="text-[11px] text-center text-muted-foreground pt-1">
              TourneyUp Demo Mode • Instant access
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  )
}
