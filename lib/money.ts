'use client';

import { useLocale, useTranslations } from 'next-intl';

/**
 * Every price in this app is Tajik somoni — the backend stamps `TJS` on every service,
 * booking and product (`SERVICE_CURRENCY`). The UI used to print a bare `$`, which was
 * simply the wrong currency shown to every user.
 *
 * The number is grouped and decimalised by the viewer's locale; the unit itself comes
 * from the message catalogue, so Tajik reads "260,00 сомонӣ/соат" and English reads
 * "260.00 TJS/hr" rather than one hardcoded string for all three.
 */
const INTL_LOCALE: Record<string, string> = { tj: 'tg-TJ', ru: 'ru-RU', en: 'en-US' };

export const formatAmount = (value: string | number | null | undefined, locale: string): string => {
  const amount = typeof value === 'string' ? Number(value) : value;

  if (amount === null || amount === undefined || !Number.isFinite(amount)) return '—';

  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export type MoneyFormatters = {
  /** "260,00 сомонӣ" — a plain amount. */
  money: (value: string | number | null | undefined) => string;
  /** "260,00 сомонӣ/соат" — the hourly rate shown on every master card. */
  perHour: (value: string | number | null | undefined) => string;
};

export function useMoney(): MoneyFormatters {
  const locale = useLocale();
  const t = useTranslations('common');

  const format = (value: string | number | null | undefined, key: 'money' | 'moneyPerHour') => {
    const amount = formatAmount(value, locale);
    return amount === '—' ? amount : t(key, { amount });
  };

  return {
    money: (value) => format(value, 'money'),
    perHour: (value) => format(value, 'moneyPerHour'),
  };
}
