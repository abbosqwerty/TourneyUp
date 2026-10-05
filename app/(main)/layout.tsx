import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'
import { AuthModalProvider } from '@/components/auth-modal'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  let user = null
  if (userId) {
    user = await db.user.findUnique({
      where: { id: userId }
    })
  }

  const isOrgUser = user ? (user.id.startsWith('org') || user.globalRank === 0) : false

  return (
    <AuthModalProvider initialUser={user}>
      <div className="min-h-screen bg-background">
        <Navbar currentUser={user} isOrganizer={isOrgUser} />
        <main className="pb-20 md:pb-0">
          {children}
        </main>
        <MobileNav currentUser={user} isOrganizer={isOrgUser} />
      </div>
    </AuthModalProvider>
  )
}
