export const locales = ['tj', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];

/**
 * Tajik, until someone says otherwise.
 *
 * The product is a Dushanbe marketplace: the masters are here, the clients are here, and
 * the prices are in somoni. Opening in English meant every first-time visitor landed on
 * a page in a language most of them do not read, and had to find a flag in the header to
 * fix it. The switcher is still there for the ones who want Russian or English.
 */
export const defaultLocale: Locale = 'tj';

export const localeMeta: Record<Locale, { flag: string; label: string }> = {
  tj: { flag: '🇹🇯', label: 'Тоҷикӣ' },
  ru: { flag: '🇷🇺', label: 'Русский' },
  en: { flag: '🇺🇸', label: 'English' },
};
