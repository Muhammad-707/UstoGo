import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PagePreviewSwitcher } from '@/components/layout/PagePreviewSwitcher';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
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
    <html lang={locale} className={`${inter.variable} antialiased`} suppressHydrationWarning>
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
            <Navbar />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <PagePreviewSwitcher />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
