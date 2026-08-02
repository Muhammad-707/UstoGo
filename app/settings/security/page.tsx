'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, usersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { validatePassword, type ValidationErrorKey } from '@/lib/validation';
import type { Session } from '@/lib/api/types';

export default function SecuritySettingsPage() {
  const t = useTranslations('settingsSecurity');
  const tv = useTranslations('validation');
  const { logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<ValidationErrorKey | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  const [changeError, setChangeError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSessions = useCallback(() => {
    setSessionsLoading(true);
    authApi.sessions
      .list()
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangeError(null);
    setChanged(false);
    const pwErr = validatePassword(newPassword);
    setNewPasswordError(pwErr);
    setConfirmError(newPassword !== confirmPassword ? t('passwordMismatch') : null);
    if (pwErr || newPassword !== confirmPassword) return;
    setChanging(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setChanged(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setChangeError(err instanceof ApiError ? err.message : t('changeFailed'));
    } finally {
      setChanging(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      await authApi.sessions.revoke(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore — list will self-correct on next load
    } finally {
      setRevokingId(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm(t('confirmLogoutAll'))) return;
    setLoggingOutAll(true);
    try {
      await authApi.logoutAll();
      await logout();
    } catch {
      setLoggingOutAll(false);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleString();

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await usersApi.exportMe();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ustogo-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // ignore — best-effort
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('accountSettings')}
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('title')}</h1>
      </div>

      {/* Change Password */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="key" size={18} />
          {t('changePasswordTitle')}
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('currentPasswordLabel')}</label>
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('newPasswordLabel')}</label>
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              error={!!newPasswordError}
              required
            />
            {newPasswordError && <p className="text-red-500 text-xs">{tv(newPasswordError)}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('confirmPasswordLabel')}</label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              error={!!confirmError}
              required
            />
            {confirmError && <p className="text-red-500 text-xs">{confirmError}</p>}
          </div>
          {changeError && <p className="text-xs font-bold text-red-600 dark:text-red-400">{changeError}</p>}
          {changed && <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{t('changeSuccess')}</p>}
          <button
            type="submit"
            disabled={changing}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md disabled:opacity-60 transition"
          >
            {changing ? t('changing') : t('changePasswordButton')}
          </button>
        </form>
      </div>

      {/* Active Sessions */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="wifi" size={18} />
            {t('activeSessionsTitle')}
          </h3>
          <button
            onClick={handleLogoutAll}
            disabled={loggingOutAll}
            className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline disabled:opacity-60"
          >
            {t('logoutAllDevices')}
          </button>
        </div>

        {sessionsLoading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
        {!sessionsLoading && sessions.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">{t('noSessions')}</p>
        )}

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sessions.map((session) => (
            <div key={session.id} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {session.userAgent ?? t('unknownDevice')}
                  </span>
                  {session.current && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold whitespace-nowrap">
                      {t('thisDevice')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {t('lastActive', { date: formatDate(session.lastActiveAt) })}
                  {session.ipAddress ? ` • ${session.ipAddress}` : ''}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(session.id)}
                disabled={revokingId === session.id}
                className="shrink-0 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
              >
                {t('revoke')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl flex items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Icon name="filetext" size={18} />
            {t('exportDataTitle')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{t('exportDataDesc')}</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="shrink-0 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-60"
        >
          {exporting ? t('exporting') : t('exportDataButton')}
        </button>
      </div>
    </div>
  );
}
