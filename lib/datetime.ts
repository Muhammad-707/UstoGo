'use client';

import { useLocale, useTranslations } from 'next-intl';

/**
 * Weekday names come from the message catalogue rather than `Intl`.
 *
 * The app's locale codes are `tj`/`ru`/`en`, and `tj` is not a language tag — Tajik is
 * `tg` — so `toLocaleDateString('tj', …)` fell through to the browser's own default and
 * printed Russian weekday names under a fully Tajik interface. Even the correct `tg` tag
 * is missing from most CLDR builds, so translating them ourselves is the only way to be
 * sure the schedule reads in the language the user actually chose.
 *
 * `weekday` is the JavaScript convention the API also uses: 0 = Sunday … 6 = Saturday.
 */
/**
 * Month names, from the catalogue, for the same reason the weekdays are.
 *
 * A long-month date built with `Intl` was the app's one hydration mismatch: Node
 * resolved `tg-TJ` one way and the browser another, so the server sent
 * "14 Август 2026" and the client re-rendered "14 августа 2026 г." — React threw the
 * whole subtree away on every page that shows a date picker. Names we own render the
 * same in both places by construction.
 *
 * `month` is 0-based, matching `Date.prototype.getMonth`.
 */
export function useMonthNames() {
  const t = useTranslations('common');
  const names = t.raw('months') as string[];

  return {
    long: (month: number): string => names[month] ?? '',
    /** "14 Август 2026" — day, month name, year, in that order for all three locales. */
    formatLongDate: (date: Date): string => `${date.getDate()} ${names[date.getMonth()] ?? ''} ${date.getFullYear()}`,
  };
}

export function useWeekdays() {
  const t = useTranslations('common');
  const long = t.raw('weekdays') as string[];
  const short = t.raw('weekdaysShort') as string[];

  return {
    long: (weekday: number): string => long[weekday] ?? '',
    short: (weekday: number): string => short[weekday] ?? '',
    ofDate: (date: Date): string => short[date.getDay()] ?? '',
  };
}

/**
 * Dates and times in the locale the user picked, not the one their browser happens to
 * be set to.
 *
 * Every call site used a bare `toLocaleString()`, which reads `navigator.language` and
 * ignores the app entirely — so a fully Tajik dashboard printed US-format timestamps
 * for anyone on an English browser, and the same row looked different to two people
 * reading the same page. `tj` is mapped to `tg-TJ` for the same reason `useWeekdays`
 * exists: `tj` is not a language tag.
 */
const INTL_LOCALE: Record<string, string> = { tj: 'tg-TJ', ru: 'ru-RU', en: 'en-US' };

export function useDateFormat() {
  const locale = useLocale();
  const tag = INTL_LOCALE[locale] ?? 'en-US';

  const parse = (value: string | number | Date | null | undefined): Date | null => {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  return {
    /** 10.08.2026 */
    date: (value: string | number | Date | null | undefined): string =>
      parse(value)?.toLocaleDateString(tag) ?? '—',
    /** 10.08.2026, 15:13 */
    dateTime: (value: string | number | Date | null | undefined): string =>
      parse(value)?.toLocaleString(tag, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }) ?? '—',
    /** 15:13 */
    time: (value: string | number | Date | null | undefined): string =>
      parse(value)?.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }) ?? '—',
    /** 1 234 — grouped by the same locale as the dates. */
    number: (value: number | null | undefined): string =>
      value === null || value === undefined ? '—' : value.toLocaleString(tag),
  };
}
