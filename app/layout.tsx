import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';
import { AuthProvider } from '@/contexts/AuthContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { SITE_URL } from '@/lib/seo';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

// Inter stays the single typeface of the product; shadcn's `--font-sans` token
// is pointed at it in globals.css instead of pulling in a second family.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * The phone half of the product, declared.
 *
 * `viewportFit: 'cover'` lets the page reach under the notch and the home indicator; the
 * bottom bar and the header then pay that back with `env(safe-area-inset-*)`, which is
 * what makes an installed PWA sit in the screen like an app rather than inside a white
 * letterbox. `maximumScale` is deliberately absent: pinch-zoom stays available, because
 * taking it away breaks the page for anyone who needs to enlarge it.
 */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  const title = t('metaTitle');
  const description = t('metaDescription');

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | UstoGo` },
    description,
    manifest: '/manifest.webmanifest',
    // "Add to home screen" on iOS: no Safari chrome, the app's own name under the icon.
    appleWebApp: { capable: true, statusBarStyle: 'default', title: 'UstoGo' },
    formatDetection: { telephone: false },
    openGraph: {
      type: 'website',
      siteName: 'UstoGo',
      title,
      description,
      url: SITE_URL,
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/opengraph-image'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={cn('antialiased font-sans', inter.variable)} suppressHydrationWarning>
      <head>
        {/* Light unless this browser has asked for dark, before the first paint.
            It used to follow the OS, so a phone on its usual night schedule opened
            UstoGo in dark mode without anyone choosing it. Dark is now a decision the
            reader makes with the switch in the header, and it is remembered. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('ustogo-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300" suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider>
            <FavoritesProvider>
              <TooltipProvider delayDuration={200}>
                <Navbar />
                <main className="flex-1 w-full">{children}</main>
                <Footer />
                {/* Last in the flow on purpose: it renders its own spacer, so the fixed
                    bar reserves its height at the very end of the page rather than
                    covering the footer. */}
                <BottomNav />
                <ServiceWorkerRegister />
                <Toaster richColors closeButton position="top-center" />
              </TooltipProvider>
            </FavoritesProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
