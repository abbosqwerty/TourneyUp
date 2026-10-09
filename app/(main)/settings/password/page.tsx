import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordForm } from './password-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Parolni almashtirish', robots: { index: false } }

export default async function ChangePasswordPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login?next=%2Fsettings%2Fpassword')

  return (
    <div className="container mx-auto max-w-md px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Parolni almashtirish</CardTitle>
          <CardDescription>
            {user.mustChangePassword
              ? 'Sizga berilgan vaqtinchalik parolni o‘zingizning parolingizga almashtiring.'
              : 'Yangi parol kiritilgandan keyin boshqa barcha qurilmalardagi seans yopiladi.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm mustChange={user.mustChangePassword} role={user.role} />
        </CardContent>
      </Card>
    </div>
  )
}
