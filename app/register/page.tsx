import type { Metadata } from 'next';
import { getI18n } from '@/lib/i18n/server';
import RegisterContent from './RegisterContent';

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getI18n();
  return { title: dict.account.register.meta_title };
}

export default function RegisterPage() {
  return <RegisterContent />;
}
