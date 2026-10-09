import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Ro‘yxatdan o‘tish',
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Ro‘yxatdan o‘tish"
      subtitle="Hamma oddiy foydalanuvchi sifatida boshlaydi — turnirlarga yoziling, kanallarga obuna bo‘ling"
      footer={
        <>
          Akkauntingiz bormi?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Kirish
          </Link>
          <br />
          Tashkilot akkaunti kerakmi?{' '}
          <Link href="/organizations/apply" className="font-semibold text-primary hover:underline">
            Ariza yuborish
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
