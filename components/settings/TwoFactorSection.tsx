'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import QRCode from 'qrcode';
import { Icon } from '@/components/icons/LucideIcons';
import { authApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type Stage = 'idle' | 'enrolling' | 'disabling';

/**
 * TOTP enrolment. ADMIN-only, matching the backend — `POST /auth/2fa/*` is
 * `@ApiAuth(UserRole.ADMIN)`, so the card is not rendered for anyone else rather
 * than offering a button that would 403.
 */
export function TwoFactorSection() {
  const t = useTranslations('settingsSecurity');
  const { user, refreshUser } = useAuth();

  const [stage, setStage] = useState<Stage>('idle');
  const [secret, setSecret] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const enabled = user?.totpEnabled === true;

  if (!user || user.role !== 'ADMIN') return null;

  const reset = () => {
    setStage('idle');
    setSecret(null);
    setQrDataUrl(null);
    setCode('');
    setError(null);
  };

  const startEnrolment = async () => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const setup = await authApi.twoFactor.setup();
      setSecret(setup.secret);
      setQrDataUrl(await QRCode.toDataURL(setup.otpauthUrl, { width: 220, margin: 1 }));
      setStage('enrolling');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('twoFactorSetupFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrolment = async () => {
    if (code.trim().length < 6) {
      setError(t('twoFactorCodeInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.twoFactor.enable(code.trim());
      await refreshUser();
      reset();
      setSuccess(t('twoFactorEnabledOk'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('twoFactorEnableFailed'));
    } finally {
      setBusy(false);
    }
  };

  const confirmDisable = async () => {
    if (code.trim().length < 6) {
      setError(t('twoFactorCodeInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.twoFactor.disable(code.trim());
      await refreshUser();
      reset();
      setSuccess(t('twoFactorDisabledOk'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('twoFactorDisableFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${
              enabled
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Icon name="shieldcheck" size={19} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('twoFactorTitle')}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">{t('twoFactorDesc')}</p>
          </div>
        </div>
        <span
          className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-extrabold ${
            enabled
              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}
        >
          {enabled ? t('twoFactorOn') : t('twoFactorOff')}
        </span>
      </div>

      {success && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{success}</p>}

      {stage === 'idle' && (
        <div className="flex items-center gap-3">
          {enabled ? (
            <Button
              variant="outline"
              onClick={() => { setStage('disabling'); setCode(''); setError(null); setSuccess(null); }}
              className="h-auto px-5 py-2.5 rounded-xl border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
            >
              {t('twoFactorDisableButton')}
            </Button>
          ) : (
            <Button
              variant="brand"
              onClick={startEnrolment}
              disabled={busy}
              className="h-auto px-6 py-2.5 rounded-xl text-xs shadow-md"
            >
              {busy ? '...' : t('twoFactorEnableButton')}
            </Button>
          )}
        </div>
      )}

      {stage === 'enrolling' && (
        <div className="space-y-5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside pt-4">
            <li>{t('twoFactorStep1')}</li>
            <li>{t('twoFactorStep2')}</li>
          </ol>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={t('twoFactorQrAlt')}
                className="w-40 h-40 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-2 shrink-0"
              />
            )}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">{t('twoFactorManualKey')}</span>
                <code className="block p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-mono break-all text-slate-700 dark:text-slate-200">
                  {secret}
                </code>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{t('twoFactorSecretOnce')}</p>
              </div>

              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="000000"
                aria-label={t('twoFactorConfirmButton')}
                className="p-3.5 rounded-xl text-center text-lg font-extrabold tracking-[0.4em] font-mono"
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              onClick={confirmEnrolment}
              disabled={busy}
              className="h-auto px-6 py-2.5 rounded-xl text-xs shadow-md"
            >
              {busy ? '...' : t('twoFactorConfirmButton')}
            </Button>
            <Button variant="ghost" onClick={reset} className="h-auto px-4 py-2.5 rounded-xl text-slate-500 text-xs font-bold hover:text-slate-700 dark:hover:text-slate-300">
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {stage === 'disabling' && (
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('twoFactorDisableHint')}</p>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="000000"
            aria-label={t('twoFactorDisableButton')}
            className="w-full sm:w-56 p-3.5 rounded-xl text-center text-lg font-extrabold tracking-[0.4em] font-mono"
          />
          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              onClick={confirmDisable}
              disabled={busy}
              className="h-auto px-6 py-2.5 rounded-xl text-xs shadow-md bg-red-600 hover:bg-red-700 shadow-red-600/25"
            >
              {busy ? '...' : t('twoFactorDisableButton')}
            </Button>
            <Button variant="ghost" onClick={reset} className="h-auto px-4 py-2.5 rounded-xl text-slate-500 text-xs font-bold hover:text-slate-700 dark:hover:text-slate-300">
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
