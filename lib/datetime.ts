'use client';

import { useTranslations } from 'next-intl';

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
