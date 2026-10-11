'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth/auth-shell';
import { useLanguage } from '@/lib/i18n/language-context';
import { LoginForm } from './login-form';

export default function LoginContent({ nextPath }: { nextPath?: string }) {
  const { dict } = useLanguage();

  return (
    <AuthShell
      title={dict.auth.login_title}
      subtitle={dict.auth.login_subtitle}
      footer={
        <>
          {dict.auth.no_account}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            {dict.auth.register_link}
          </Link>
          <br />
          {dict.auth.apply_org}{' '}
          <Link href="/organizations/apply" className="font-semibold text-primary hover:underline">
            {dict.auth.apply_link}
          </Link>
        </>
      }
    >
      <LoginForm nextPath={nextPath} />
    </AuthShell>
  );
}
