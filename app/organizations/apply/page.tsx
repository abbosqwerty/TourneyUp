import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthShell } from '@/components/auth/auth-shell'
import { ApplyForm } from './apply-form'

export const metadata: Metadata = {
  title: 'Tashkilot bo‘lib ariza yuborish',
  description:
    'TourneyUp platformasida rasmiy tashkilot bo‘lib turnirlar o‘tkazish uchun ariza yuboring. Super admin arizani ko‘rib chiqib, sizga akkaunt yaratib beradi.',
}

export default function ApplyPage() {
  return (
    <AuthShell
      wide
      title="Tashkilot arizasi"
      subtitle="Arizangiz super admin dashboard'ida ko‘rinadi. Tasdiqlangandan keyin sizga login va parol beriladi."
      footer={
        <>
          Oddiy foydalanuvchi bo‘lib qo‘shilmoqchimisiz?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Ro‘yxatdan o‘tish
          </Link>
        </>
      }
    >
      <ApplyForm />
    </AuthShell>
  )
}
