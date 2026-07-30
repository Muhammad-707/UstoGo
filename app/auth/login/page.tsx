'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';

export default function LoginPage() {
  const t = useTranslations('authLogin');
  const router = useRouter();
  const [email, setEmail] = useState('client@ustogo.com');
  const [password, setPassword] = useState('password123');

  const handleLogin = (targetPath: string) => {
    router.push(targetPath);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-8 animate-fade-in">
        
        {/* Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg">
              <Icon name="Wrench" size={22} />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">UstoGo</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('welcomeBack')}</h2>
          <p className="text-xs text-slate-500">{t('signInSubtitle')}</p>
        </div>

        {/* Quick Demo Login Buttons */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">{t('quickDemoSwitcher')}</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleLogin('/dashboard/client')}
              className="py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-300 text-[11px] font-bold hover:bg-blue-100 transition"
            >
              {t('asClient')}
            </button>
            <button
              onClick={() => handleLogin('/dashboard/master')}
              className="py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold hover:bg-amber-100 transition"
            >
              {t('asMaster')}
            </button>
            <button
              onClick={() => handleLogin('/dashboard/admin')}
              className="py-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-100 transition"
            >
              {t('asAdmin')}
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleLogin('/dashboard/client'); }} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('emailLabel')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('passwordLabel')}</label>
              <Link href="/auth/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
                {t('forgot')}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg transition btn-ripple"
          >
            {t('signInButton')}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 space-y-1">
          <p>{t('noAccount')}</p>
          <div className="flex justify-center gap-4 font-bold text-blue-600">
            <Link href="/auth/register/client" className="hover:underline">{t('registerAsClient')}</Link>
            <span>•</span>
            <Link href="/auth/register/master" className="hover:underline text-amber-500">{t('joinAsMaster')}</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
