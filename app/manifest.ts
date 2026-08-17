import type { MetadataRoute } from 'next';

/**
 * §6.13 (MASTER_PROMPT.md) — installable PWA shell.
 *
 * `background_color` is the splash screen an installed app shows before the first paint,
 * so it has to be the colour the app actually opens in. It was slate-950 while the app
 * opens light, which read as a black flash on every cold start.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UstoGo — Бозори Устоҳои Элита',
    short_name: 'UstoGo',
    description:
      'Устоҳои санҷидашуда барои хона: барқчӣ, обчӣ, устои таъмир, кӯчонидан ва хизматрасониҳои дигар — бо кафолат ва нархи шаффоф.',
    lang: 'tg',
    dir: 'ltr',
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#F8FAFC',
    orientation: 'portrait-primary',
    categories: ['business', 'lifestyle', 'shopping'],
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press the installed icon: the two things people open the app to do.
    shortcuts: [
      { name: 'Ҷустуҷӯи устоҳо', short_name: 'Ҷустуҷӯ', url: '/search' },
      { name: 'Фармоиши усто', short_name: 'Фармоиш', url: '/booking' },
    ],
  };
}
