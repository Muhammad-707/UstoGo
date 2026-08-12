'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminReport, ReportStatus } from '@/lib/api/types';
import { useDateFormat } from '@/lib/datetime';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

const STATUS_STYLE: Record<ReportStatus, string> = {
  OPEN: 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300',
  REVIEWED: 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300',
  RESOLVED: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  REJECTED: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
};

export default function AdminReportsPage() {
  const t = useTranslations('adminReports');
  const fmt = useDateFormat();
  const te = useTranslations('enums');
  useRequireAuth(['ADMIN']);

  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReportStatus | ''>('OPEN');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.reports.list({ status: status || undefined, page, limit: 20 });
      setReports(res.items);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches reports on status/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  const handleResolve = async (id: string, decision: 'RESOLVED' | 'REJECTED') => {
    const adminNote = window.prompt(t('adminNotePrompt')) ?? undefined;
    setActingId(id);
    try {
      await adminApi.reports.resolve(id, { status: decision, adminNote: adminNote || undefined });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to resolve report.');
    } finally {
      setActingId(null);
    }
  };

  const handleBlockReported = async (reportedUserId: string) => {
    const reason = window.prompt('Reason for blocking this account (10-500 characters):');
    if (!reason || reason.trim().length < 10) return;
    try {
      await adminApi.users.block(reportedUserId, reason.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to block user.');
    }
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

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <Select value={status || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setStatus(value as ReportStatus | ''); setPage(1); }}>
          <SelectTrigger className="p-2.5 rounded-xl text-xs font-bold w-fit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>{t('allStatuses')}</SelectItem>
          <SelectItem value="OPEN">{t('statusOPEN')}</SelectItem>
          <SelectItem value="REVIEWED">{t('statusREVIEWED')}</SelectItem>
          <SelectItem value="RESOLVED">{t('statusRESOLVED')}</SelectItem>
          <SelectItem value="REJECTED">{t('statusREJECTED')}</SelectItem>
          </SelectContent>
        </Select>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && reports.length === 0 && (
          <EmptyState icon="filetext" title={t('noResults')} />
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-full font-bold text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {te(`reportType.${r.type}`)}
                    </span>
                    <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${STATUS_STYLE[r.status]}`}>{te(`reportStatus.${r.status}`)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{fmt.dateTime(r.createdAt)}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <p><span className="text-slate-400 font-bold">{t('reporter')}:</span> {r.reporterEmail}</p>
                  <p><span className="text-slate-400 font-bold">{t('reported')}:</span> {r.reportedEmail}</p>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300"><span className="text-slate-400 font-bold">{t('description')}:</span> {r.description}</p>

                {r.adminNote && (
                  <p className="text-xs text-slate-500"><span className="font-bold">{t('adminNote')}:</span> {r.adminNote}</p>
                )}
                {r.resolvedByEmail && (
                  <p className="text-[10px] text-slate-400">{t('resolvedBy')}: {r.resolvedByEmail} · {r.resolvedAt ? fmt.dateTime(r.resolvedAt) : ''}</p>
                )}

                {(r.status === 'OPEN' || r.status === 'REVIEWED') && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="raw" variant="ghost"
                      onClick={() => handleResolve(r.id, 'RESOLVED')}
                      disabled={actingId === r.id}
                      className="btn-success px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60 transition"
                    >
                      {t('resolve')}
                    </Button>
                    <Button size="raw" variant="ghost"
                      onClick={() => handleResolve(r.id, 'REJECTED')}
                      disabled={actingId === r.id}
                      className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-60 transition"
                    >
                      {t('reject')}
                    </Button>
                    <Button size="raw" variant="ghost"
                      onClick={() => handleBlockReported(r.reportedUserId)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
                    >
                      {t('blockThisUser')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button size="raw" variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('prev')}
            </Button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: totalPages })}</span>
            <Button size="raw" variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
            >
              {t('next')}
            </Button>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
