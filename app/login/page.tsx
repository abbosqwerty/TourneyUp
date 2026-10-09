import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Kirish',
  robots: { index: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <AuthShell
      title="Tizimga kirish"
      subtitle="Email yoki username va parolingiz bilan kiring"
      footer={
        <>
          Akkauntingiz yo‘qmi?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Ro‘yxatdan o‘tish
          </Link>
          <br />
          Tashkilot bo‘lib ishlashni xohlaysizmi?{' '}
          <Link href="/organizations/apply" className="font-semibold text-primary hover:underline">
            Ariza yuborish
          </Link>
        </>
      }
    >
      <LoginForm nextPath={next} />
    </AuthShell>
  )
}
