import Link from 'next/link'
import type { Prisma, UserRole } from '@prisma/client'
import { db } from '@/lib/db'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getI18n } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.admin.users.meta_title, robots: { index: false } }
}

const PAGE_SIZE = 25

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; role?: string }>
}) {
  const params = await searchParams
  const { dict } = await getI18n()
  const t = dict.admin.users
  const ROLE_LABELS = t.roles
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
          <CardTitle>{t.load_failed}</CardTitle>
          <CardDescription>{dict.admin.db_unavailable_short}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.total(total)}</p>
      </div>

      <form className="flex flex-wrap gap-2" action="/admin/users">
        <Input
          name="q"
          defaultValue={query}
          placeholder={t.search_placeholder}
          className="w-full sm:max-w-xs"
          aria-label={t.search_label}
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
                {value ? ROLE_LABELS[value] : dict.admin.all}
              </Link>
            </Button>
          ))}
        </div>
        <Button type="submit" size="sm">
          {t.search}
        </Button>
      </form>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {users.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.avatar} alt={t.avatar_alt(user.name)} />
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
                  {user.verified ? <Badge variant="secondary">{t.verified}</Badge> : null}
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
              {t.previous}
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
              {t.next}
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
