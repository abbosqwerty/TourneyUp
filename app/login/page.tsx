import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';
import LoginContent from './LoginContent';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return {
    title: dict.account.login.meta_title,
    robots: { index: false },
  };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <LoginContent nextPath={next} />;
}
