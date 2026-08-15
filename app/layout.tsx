import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  const title = t('metaTitle');
  const description = t('metaDescription');

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | UstoGo` },
    description,
    manifest: '/manifest.webmanifest',
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('ustogo-theme');var d=s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
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
