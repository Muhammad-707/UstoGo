'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';

function VerifyEmailContent() {
  const t = useTranslations('authVerifyEmail');
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const { user } = useAuth();

  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError(t('missingToken'));
      return;
    }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setError(err instanceof ApiError ? err.message : t('genericError'));
      });
  }, [token, t]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      setResent(true);
    } catch {
      // ignore — best-effort
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6 animate-fade-in text-center">
        {status === 'pending' && (
          <div className="space-y-4">
            <div className="w-6 h-6 mx-auto rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-sky-400 animate-spin" />
            <p className="text-xs text-slate-500">{t('verifying')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('successTitle')}</h2>
            <p className="text-xs text-slate-500">{t('successDesc')}</p>
            <Link
              href={user ? '/' : '/auth/login'}
              className="inline-block px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs"
            >
              {user ? t('continue') : t('goToLogin')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✕
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('errorTitle')}</h2>
            <p className="text-xs text-slate-500">{error}</p>
            {user && !resent && (
              <button
                onClick={handleResend}
                disabled={resending}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs disabled:opacity-60"
              >
                {resending ? t('resending') : t('resendLink')}
              </button>
            )}
            {resent && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('resentDesc')}</p>}
            <Link href="/auth/login" className="block text-xs font-bold text-slate-500 hover:underline">
              {t('backToLogin')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
