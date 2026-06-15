'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trophy, User, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { loginUser } from '@/lib/actions'

export default function LoginPage() {
  const [usernameInput, setUsernameInput] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const router = useRouter()

  const handleDemoLogin = async (userId: string, role: string) => {
    setIsLoading(userId)
    setError('')
    try {
      await loginUser(userId)
      // If organizer, go to dashboard. If player, go to feed
      if (role === 'organizer') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/feed'
      }
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
    
    // Map demo usernames to user IDs
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
      setError('Invalid username for demo. Use "abbosq" or "tashkent_sports".')
      return
    }

    setIsLoading('custom')
    setError('')
    try {
      await loginUser(targetUserId)
      if (role === 'organizer') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/feed'
      }
    } catch (err) {
      console.error(err)
      setError('Login failed.')
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary glow-primary">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Tourney<span className="text-primary">Up</span>
          </h1>
          <p className="text-sm text-slate-400">Discover & Compete in Local Tournaments</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl glow-primary/5">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Access the tournament platform using a demo account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Demo Notice Alert */}
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 flex gap-3 text-warning">
              <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Demo Authentication Mode</p>
                <p className="text-slate-300 leading-relaxed">
                  Use the quick-select buttons below to log in as either a Player or an Organizer to test full site functionalities.
                </p>
              </div>
            </div>

            {/* Quick Demo Logins */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                Quick Login Options
              </label>
              
              {/* Player Quick Login */}
              <button
                type="button"
                onClick={() => handleDemoLogin('user1', 'player')}
                disabled={isLoading !== null}
                className="w-full p-4 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-primary/50 text-left transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      Abbos Qurbonov
                    </p>
                    <p className="text-xs text-slate-400">Role: Tournament Player</p>
                  </div>
                </div>
                {isLoading === 'user1' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Badge variant="outline" className="border-slate-700 text-slate-400 group-hover:border-primary group-hover:text-primary transition-colors">
                    Log In <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </button>

              {/* Organizer Quick Login */}
              <button
                type="button"
                onClick={() => handleDemoLogin('org1', 'organizer')}
                disabled={isLoading !== null}
                className="w-full p-4 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-950/80 hover:border-primary/50 text-left transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">
                      Tashkent Sports Association
                    </p>
                    <p className="text-xs text-slate-400">Role: Tournament Organizer</p>
                  </div>
                </div>
                {isLoading === 'org1' ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <Badge variant="outline" className="border-slate-700 text-slate-400 group-hover:border-primary group-hover:text-primary transition-colors">
                    Log In <ArrowRight className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-xs font-semibold uppercase">Or enter username</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Custom Username Input */}
            <form onSubmit={handleCustomLogin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="e.g., abbosq or tashkent_sports"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-500"
                  disabled={isLoading !== null}
                />
              </div>

              {error && (
                <p className="text-xs text-destructive font-medium">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={isLoading !== null || !usernameInput.trim()}
              >
                {isLoading === 'custom' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In with Username'
                )}
              </Button>
            </form>

          </CardContent>
          <CardFooter className="flex flex-col items-center text-center border-t border-slate-800/50 pt-4">
            <p className="text-xs text-slate-500">
              TourneyUp Demo Mode • Local MySQL Storage
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
