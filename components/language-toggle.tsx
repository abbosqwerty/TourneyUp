'use client';

import { Globe } from 'lucide-react';
import { LOCALES, type Locale } from '@/lib/i18n/types';
import { useLanguage } from '@/lib/i18n/language-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LanguageToggleProps {
  className?: string;
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'default' | 'sm' | 'icon';
  showLabel?: boolean;
}

export function LanguageToggle({
  className,
  variant = 'ghost',
  size = 'sm',
  showLabel = false,
}: LanguageToggleProps) {
  const { locale, setLocale, dict } = useLanguage();

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          aria-label={dict.chrome.language.select}
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-base leading-none">{current.flag}</span>
            <span className="text-xs uppercase">{current.shortLabel}</span>
            {showLabel && <span className="hidden sm:inline text-xs ml-1">{current.label}</span>}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {LOCALES.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLocale(item.code)}
            className={`flex items-center justify-between cursor-pointer text-xs py-2 ${
              item.code === locale ? 'bg-primary/10 font-bold text-primary' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{item.flag}</span>
              <span>{item.label}</span>
            </span>
            {item.code === locale ? <span className="text-primary font-bold">✓</span> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
