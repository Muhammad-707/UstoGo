import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import fs from 'node:fs';
import path from 'node:path';
import { locales, defaultLocale, type Locale } from './locales';

function loadMessages(locale: Locale) {
  const dir = path.join(process.cwd(), 'messages', locale);
  const messages: Record<string, unknown> = {};

  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const namespace = file.replace(/\.json$/, '');
    messages[namespace] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
  }

  return messages;
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const stored = cookieStore.get('ustogo-lang')?.value;
  const locale: Locale = (locales as readonly string[]).includes(stored ?? '')
    ? (stored as Locale)
    : defaultLocale;

  return {
    locale,
    messages: loadMessages(locale),
  };
});
