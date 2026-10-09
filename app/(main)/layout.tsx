import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/session'
import { countUnreadNotifications } from '@/lib/notifications'
import { Navbar } from '@/components/navbar'
import { MobileNav } from '@/components/mobile-nav'
import { AuthModalProvider } from '@/components/auth-modal'

/**
 * Shared chrome for the signed-in app. Everything here is wrapped in
 * try/catch: a database outage must not blank the whole route group.
 */
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  let unreadCount = 0
  let staffAssignmentCount = 0
  let notificationCount = 0

  if (user) {
    try {
      const memberships = await db.channelMember.findMany({
        where: { userId: user.id },
        select: { channelId: true, lastReadAt: true },
      })

      // One OR'd count instead of a query per membership.
      const [posts, staff, notifications] = await Promise.all([
        memberships.length
          ? db.channelPost.count({
              where: {
                OR: memberships.map((membership) => ({
                  channelId: membership.channelId,
                  ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
                })),
              },
            })
          : Promise.resolve(0),
        db.tournamentStaff.count({
          where: {
            userId: user.id,
            revokedAt: null,
            tournament: { status: { notIn: ['completed', 'cancelled'] } },
          },
        }),
        countUnreadNotifications(user.id),
      ])

      unreadCount = posts
      staffAssignmentCount = staff
      notificationCount = notifications
    } catch (error) {
      console.error('main layout counters failed', error)
    }
  }

  const navUser = user
    ? { id: user.id, name: user.name, username: user.username, avatar: user.avatar, role: user.role }
    : null

  return (
    <AuthModalProvider initialUser={navUser}>
      <div className="min-h-screen bg-background">
        <Navbar
          currentUser={navUser}
          unreadCount={unreadCount}
          staffAssignmentCount={staffAssignmentCount}
          notificationCount={notificationCount}
        />
        <main className="pb-20 md:pb-0">{children}</main>
        <MobileNav
          role={user?.role ?? null}
          unreadCount={unreadCount}
          staffAssignmentCount={staffAssignmentCount}
        />
      </div>
    </AuthModalProvider>
  )
}
