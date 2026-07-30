export const locales = ['tj', 'ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const localeMeta: Record<Locale, { flag: string; label: string }> = {
  tj: { flag: '🇹🇯', label: 'Тоҷикӣ' },
  ru: { flag: '🇷🇺', label: 'Русский' },
  en: { flag: '🇺🇸', label: 'English' },
};
