import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value

  if (!userId) {
    redirect('/login')
  }

  const user = await db.user.findUnique({
    where: { id: userId }
  })

  if (!user) {
    redirect('/login')
  }

  const isOrgUser = user.id.startsWith('org') || user.globalRank === 0

  return (
    <div className="min-h-screen bg-background">
      <Navbar currentUser={user} isOrganizer={isOrgUser} />
      <main className="pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav isOrganizer={isOrgUser} />
    </div>
  )
}
