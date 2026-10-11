import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getI18n } from '@/lib/i18n/server'
import { PasswordForm } from './password-form'

export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const { dict } = await getI18n()
  return { title: dict.account.password.meta_title, robots: { index: false } }
}

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings%2Fpassword')
  const { dict } = await getI18n()
  const t = dict.account.password

  return (
    <div className="container mx-auto max-w-md px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? t.desc_must_change
              : t.desc_normal}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm mustChange={user.mustChangePassword} role={user.role} />
        </CardContent>
      </Card>
    </div>
  )
}
