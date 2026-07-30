'use server';

import { cookies } from 'next/headers';
import { locales, type Locale } from './locales';

export async function setLocale(locale: Locale) {
  if (!(locales as readonly string[]).includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set('ustogo-lang', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
}
