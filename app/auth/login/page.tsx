'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth, dashboardPathFor } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validateEmail, validateRequired, type ValidationErrorKey } from '@/lib/validation';

export default function LoginPage() {
  const t = useTranslations('authLogin');
  const tv = useTranslations('validation');
  const router = useRouter();
  const { login, completeTwoFactor } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [emailError, setEmailError] = useState<ValidationErrorKey | null>(null);
  const [passwordError, setPasswordError] = useState<ValidationErrorKey | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTwoFactor(false);
    const emailErr = validateEmail(email);
    const passwordErr = validateRequired(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.twoFactor) {
        setTwoFactor(true);
        return;
      }
      router.push(dashboardPathFor(result.user?.role ?? 'CLIENT'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!twoFactorCode.trim()) return;
    setSubmitting(true);
    try {
      const me = await completeTwoFactor(twoFactorCode.trim());
      router.push(dashboardPathFor(me.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code. Please try again.');
    } finally {
      setSubmitting(false);
    }
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

        {/* Two-Factor Step */}
        {twoFactor ? (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            <p className="text-amber-600 dark:text-amber-400 text-xs font-bold">{t('twoFactorRequired')}</p>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('twoFactorCodeLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 tracking-widest text-center"
                placeholder="000000"
                autoFocus
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
            >
              {submitting ? t('verifying') : t('verifyButton')}
            </button>
            <button
              type="button"
              onClick={() => {
                setTwoFactor(false);
                setTwoFactorCode('');
                setError(null);
              }}
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {t('backToLogin')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 ${emailError ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                required
              />
              {emailError && <p className="text-red-500 text-xs">{tv(emailError)}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('passwordLabel')}</label>
                <Link href="/auth/forgot-password" className="text-xs font-bold text-blue-600 hover:underline">
                  {t('forgot')}
                </Link>
              </div>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                error={!!passwordError}
                required
              />
              {passwordError && <p className="text-red-500 text-xs">{tv(passwordError)}</p>}
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lg transition btn-ripple"
            >
              {submitting ? t('signingIn') : t('signInButton')}
            </button>
          </form>
        )}

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
