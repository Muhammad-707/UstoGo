'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('authForgotPassword');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6 animate-fade-in text-center">
        {submitted ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-sky-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✉️
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('resetLinkSentTitle')}</h2>
            <p className="text-xs text-slate-500">{t('resetLinkSentDesc')}</p>
            <Link href="/auth/login" className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs">
              {t('returnToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-xs text-slate-500">{t('subtitle')}</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
              <input type="email" placeholder={t('emailPlaceholder')} className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs" required />
              <button type="submit" className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple">
                {t('sendResetLink')}
              </button>
            </form>

            <Link href="/auth/login" className="block text-xs font-bold text-slate-500 hover:underline">
              {t('backToLogin')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
