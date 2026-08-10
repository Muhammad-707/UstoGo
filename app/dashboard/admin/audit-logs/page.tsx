'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AUDIT_ACTIONS, type AuditLog, type Paginated } from '@/lib/api/types';

/** Colour-codes the destructive actions so a scan of the list surfaces them first. */
function toneFor(action: string): string {
  if (/DELETED|BLOCKED|REJECTED|DEACTIVATED|CANCELLED|HIDDEN/.test(action)) {
    return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
  }
  if (/CREATED|APPROVED|ACTIVATED|VERIFIED|UNBLOCKED|UNHIDDEN/.test(action)) {
    return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300';
  }
  if (/ACCESSED|BROADCAST/.test(action)) {
    return 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300';
}

export default function AdminAuditLogsPage() {
  const t = useTranslations('adminAuditLogs');
  useRequireAuth(['ADMIN']);

  const [result, setResult] = useState<Paginated<AuditLog> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading before an async fetch
    setLoading(true);
    setError(null);
    adminApi
      .auditLogs({
        page,
        limit: 20,
        action: action || undefined,
        entityType: entityType.trim() || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
      })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('loadFailed'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action, entityType, from, to]);

  const resetFilters = () => {
    setAction('');
    setEntityType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition"
        >
          <Icon name="chevronleft" size={14} />
          {t('back')}
        </Link>
      }
    >
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="space-y-1.5">
            <span className="font-bold text-slate-500">{t('actionLabel')}</span>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            >
              <option value="">{t('allActions')}</option>
              {AUDIT_ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-500">{t('entityTypeLabel')}</span>
            <input
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
              placeholder={t('entityTypePlaceholder')}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-500">{t('fromLabel')}</span>
            <input
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-bold text-slate-500">{t('toLabel')}</span>
            <input
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400">
            {result ? t('resultsCount', { count: result.meta.total }) : ''}
          </p>
          <button onClick={resetFilters} className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
            {t('resetFilters')}
          </button>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && result && result.items.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>
        )}

        {!loading && result && result.items.length > 0 && (
          <div className="space-y-2">
            {result.items.map((log) => {
              const open = expandedId === log.id;
              return (
                <div key={log.id} className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(open ? null : log.id)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${toneFor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        {log.entityType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate hidden sm:inline">
                        {log.entityId}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                      <Icon name="chevrondown" size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 space-y-3 text-[11px]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <p><span className="font-bold text-slate-400">{t('actorLabel')}:</span> <span className="font-mono">{log.actorUserId}</span></p>
                        <p><span className="font-bold text-slate-400">{t('entityIdLabel')}:</span> <span className="font-mono">{log.entityId}</span></p>
                        {log.ipAddress && <p><span className="font-bold text-slate-400">IP:</span> {log.ipAddress}</p>}
                        {log.reason && <p><span className="font-bold text-slate-400">{t('reasonLabel')}:</span> {log.reason}</p>}
                      </div>
                      {log.userAgent && (
                        <p className="text-slate-400 break-all"><span className="font-bold">UA:</span> {log.userAgent}</p>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-400">{t('beforeLabel')}</span>
                          <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto text-[10px] leading-relaxed">
                            {JSON.stringify(log.before ?? null, null, 2)}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-400">{t('afterLabel')}</span>
                          <pre className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto text-[10px] leading-relaxed">
                            {JSON.stringify(log.after ?? null, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && result && result.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('prev')}
            </button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: result.meta.totalPages })}</span>
            <button
              onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))}
              disabled={page >= result.meta.totalPages}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('next')}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
