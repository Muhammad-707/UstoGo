import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PagePreviewSwitcher } from '@/components/layout/PagePreviewSwitcher';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UstoGo – Elite Craftsmen & Home Services Marketplace',
  description: 'Connect with verified master plumbers, electricians, interior designers, HVAC experts & home specialists.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <PagePreviewSwitcher />
        </LanguageProvider>
      </body>
    </html>
  );
}
