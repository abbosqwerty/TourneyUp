'use client';

import { AuthShell } from '@/components/auth/auth-shell';
import { RegisterForm } from './register-form';
import { useLanguage } from '@/lib/i18n/language-context';
import Link from 'next/link';

export default function RegisterContent() {
  const { dict } = useLanguage();

  return (
    <AuthShell
      title={dict.auth.register_title}
      subtitle={dict.auth.register_subtitle}
      footer={
        <>
          {dict.auth.have_account}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            {dict.auth.login_button}
          </Link>
          <br />
          {dict.auth.need_org}{' '}
          <Link href="/organizations/apply" className="font-semibold text-primary hover:underline">
            {dict.auth.apply_link}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
