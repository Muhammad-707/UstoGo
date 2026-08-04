'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { AuthShell } from '@/components/auth/AuthShell';

export default function ForgotPasswordPage() {
  const t = useTranslations('authForgotPassword');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-lg btn-ripple disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? t('sending') : t('sendResetLink')}
              </button>
            </form>

            <Link href="/auth/login" className="block text-xs font-bold text-slate-500 hover:underline">
              {t('backToLogin')}
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
