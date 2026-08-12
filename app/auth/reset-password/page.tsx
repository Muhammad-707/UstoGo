'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validatePassword, type ValidationErrorKey } from '@/lib/validation';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const t = useTranslations('authResetPassword');
  const tv = useTranslations('validation');
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<ValidationErrorKey | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmError(null);
    const pwErr = validatePassword(password);
    setPasswordError(pwErr);
    if (password !== confirmPassword) {
      setConfirmError(t('passwordMismatch'));
      return;
    }
    if (pwErr) return;
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('genericError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6 animate-fade-in text-center">
        {!token ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('invalidLinkTitle')}</h2>
            <p className="text-xs text-slate-500">{t('invalidLinkDesc')}</p>
            <Button asChild variant="brand" className="h-auto px-6 py-3 rounded-xl text-xs">
              <Link href="/auth/forgot-password">{t('requestNewLink')}</Link>
            </Button>
          </div>
        ) : done ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('successTitle')}</h2>
            <p className="text-xs text-slate-500">{t('successDesc')}</p>
            <Button asChild variant="brand" className="h-auto px-6 py-3 rounded-xl text-xs">
              <Link href="/auth/login">{t('goToLogin')}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-xs text-slate-500">{t('subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <Label htmlFor="reset-password">{t('newPasswordLabel')}</Label>
                <PasswordInput
                  id="reset-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-4"
                  error={!!passwordError}
                  required
                />
                {passwordError && <p className="text-red-500 text-xs">{tv(passwordError)}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-password-confirm">{t('confirmPasswordLabel')}</Label>
                <PasswordInput
                  id="reset-password-confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="p-4"
                  error={!!confirmError}
                  required
                />
                {confirmError && <p className="text-red-500 text-xs">{confirmError}</p>}
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button type="submit" variant="brand" size="xl" disabled={submitting} className="w-full">
                {submitting ? t('resetting') : t('resetButton')}
              </Button>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
