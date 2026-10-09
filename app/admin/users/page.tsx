import Link from 'next/link'
import type { Prisma, UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Foydalanuvchilar', robots: { index: false } }

const PAGE_SIZE = 25

const ROLE_LABELS = {
  USER: 'Foydalanuvchi',
  ORGANIZATION: 'Tashkilot',
  SUPER_ADMIN: 'Super admin',
} as const

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>
}) {
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const page = Math.max(1, Number(params.page ?? '1') || 1)
  const role: UserRole | undefined =
    params.role === 'USER' || params.role === 'ORGANIZATION' || params.role === 'SUPER_ADMIN'
      ? params.role
      : undefined

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { username: { contains: query } },
            { email: { contains: query } },
          ],
        }
      : {}),
  }

  let users: Awaited<ReturnType<typeof db.user.findMany>> = []
  let total = 0
  let failed = false

  try {
    ;[users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.user.count({ where }),
    ])
  } catch (error) {
    console.error('admin users failed', error)
    failed = true
  }

  if (failed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Foydalanuvchilarni olib bo‘lmadi</CardTitle>
          <CardDescription>Baza bilan aloqa yo‘q.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Foydalanuvchilar</h1>
        <p className="text-sm text-muted-foreground">Jami {total} akkaunt</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/users">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Ism, username yoki email"
          className="w-full sm:max-w-xs"
          aria-label="Foydalanuvchilarni qidirish"
        />
        <div className="flex gap-2">
          {(['', 'USER', 'ORGANIZATION', 'SUPER_ADMIN'] as const).map((value) => (
            <Button
              key={value || 'all'}
              asChild
              size="sm"
              variant={(role ?? '') === value ? 'default' : 'outline'}
            >
              <Link
                href={{
                  pathname: '/admin/users',
                  query: { ...(query ? { q: query } : {}), ...(value ? { role: value } : {}) },
                }}
              >
                {value ? ROLE_LABELS[value] : 'Hammasi'}
              </Link>
            </Button>
          ))}
        </div>
        <Button type="submit" size="sm">
          Qidirish
        </Button>
      </form>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {users.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Natija topilmadi.</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.avatar} alt={`${user.name} avatari`} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{user.username}
                    {user.email ? ` · ${user.email}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {user.verified ? <Badge variant="secondary">Tasdiqlangan</Badge> : null}
                  <Badge variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 'outline'}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link
              href={{
                pathname: '/admin/users',
                query: { ...(query ? { q: query } : {}), ...(role ? { role } : {}), page: Math.max(1, page - 1) },
              }}
            >
              Oldingi
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link
              href={{
                pathname: '/admin/users',
                query: {
                  ...(query ? { q: query } : {}),
                  ...(role ? { role } : {}),
                  page: Math.min(totalPages, page + 1),
                },
              }}
            >
              Keyingi
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
