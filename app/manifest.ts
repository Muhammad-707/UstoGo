import type { MetadataRoute } from 'next';

/** §6.13 (MASTER_PROMPT.md) — installable PWA shell. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'UstoGo — Elite Craftsmen & Home Services Marketplace',
    short_name: 'UstoGo',
    description:
      'Connect with verified master plumbers, electricians, interior designers, HVAC experts & home specialists.',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563EB',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
