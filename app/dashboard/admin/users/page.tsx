'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/LucideIcons';
import { useTranslations } from 'next-intl';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { AdminUserListItem, UserProfile, UserRole, UserStatus } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { useDateFormat } from '@/lib/datetime';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

const STATUS_STYLE: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300',
  INACTIVE: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
  BLOCKED: 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300',
};

export default function AdminUsersPage() {
  const t = useTranslations('adminUsers');
  const fmt = useDateFormat();
  const te = useTranslations('enums');
  useRequireAuth(['ADMIN']);

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingId, setActingId] = useState<string | null>(null);

  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.users.list({
        search: search || undefined,
        role: role || undefined,
        status: status || undefined,
        page,
        limit: 20,
      });
      setUsers(res.items);
      setTotalPages(res.meta.totalPages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, status, page]);

  const openDetail = async (id: string) => {
    setSelectedLoading(true);
    try {
      const user = await adminApi.users.getById(id);
      setSelected(user);
    } catch {
      setSelected(null);
    } finally {
      setSelectedLoading(false);
    }
  };

  const handleBlock = async (id: string) => {
    const reason = window.prompt(t('blockReasonPrompt'));
    if (!reason || reason.trim().length < 10) return;
    setActingId(id);
    try {
      await adminApi.users.block(id, reason.trim());
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to block user.');
    } finally {
      setActingId(null);
    }
  };

  const handleUnblock = async (id: string) => {
    setActingId(id);
    try {
      await adminApi.users.unblock(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to unblock user.');
    } finally {
      setActingId(null);
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

      <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            />
          </div>
          <Select value={role || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setRole(value as UserRole | ''); setPage(1); }}>
            <SelectTrigger className="w-auto p-2.5 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t('allRoles')}</SelectItem>
            <SelectItem value="CLIENT">{t('roleCLIENT')}</SelectItem>
            <SelectItem value="MASTER">{t('roleMASTER')}</SelectItem>
            <SelectItem value="ADMIN">{t('roleADMIN')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setStatus(value as UserStatus | ''); setPage(1); }}>
            <SelectTrigger className="w-auto p-2.5 rounded-xl text-xs font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t('allStatuses')}</SelectItem>
            <SelectItem value="ACTIVE">{t('statusACTIVE')}</SelectItem>
            <SelectItem value="INACTIVE">{t('statusINACTIVE')}</SelectItem>
            <SelectItem value="BLOCKED">{t('statusBLOCKED')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <EmptyState icon="user" title={t('noResults')} />
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 pr-4">{t('tableUser')}</th>
                  <th className="py-3 pr-4">{t('tableRole')}</th>
                  <th className="py-3 pr-4">{t('tableStatus')}</th>
                  <th className="py-3 pr-4">{t('tableRegistered')}</th>
                  <th className="py-3 pr-4">{t('tableLastLogin')}</th>
                  <th className="py-3 pr-4">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-purple-50/50 dark:hover:bg-purple-950/10 transition-colors cursor-pointer"
                    onClick={() => openDetail(u.id)}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <img src={getAvatarUrl(u.id, u.displayName)} alt="" className="w-8 h-8 rounded-xl object-cover" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.displayName}</div>
                          <div className="text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-bold text-slate-700 dark:text-slate-300">{te(`userRole.${u.role}`)}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-1 rounded-full font-bold text-[10px] ${STATUS_STYLE[u.status]}`}>
                        {te(`userStatus.${u.status}`)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">{fmt.date(u.createdAt)}</td>
                    <td className="py-3 pr-4 text-slate-500">
                      {u.lastLoginAt ? fmt.date(u.lastLoginAt) : t('never')}
                    </td>
                    <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                      {u.status === 'BLOCKED' ? (
                        <Button size="raw" variant="ghost"
                          onClick={() => handleUnblock(u.id)}
                          disabled={actingId === u.id}
                          className="btn-success px-3 py-1.5 rounded-xl disabled:opacity-60 font-bold transition"
                        >
                          {t('unblock')}
                        </Button>
                      ) : (
                        <Button size="raw" variant="ghost"
                          onClick={() => handleBlock(u.id)}
                          disabled={actingId === u.id || u.role === 'ADMIN'}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold shadow-sm transition"
                        >
                          {t('block')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <Dialog open={!!selected || selectedLoading} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent showCloseButton={false} className="sm:max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 pr-6 flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-white">{t('detailTitle')}</DialogTitle>
              <DialogClose asChild>
                <Button size="icon" className="rounded-xl bg-white/20 hover:bg-white/30 text-white">
                  <Icon name="x" size={16} />
                </Button>
              </DialogClose>
            </DialogHeader>
            <div className="p-6 space-y-4">
              {selectedLoading && <div className="h-32 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />}
              {!selectedLoading && selected && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <p className="text-slate-400 font-bold">{t('detailEmail')}</p>
                      <p className="font-extrabold text-slate-900 dark:text-white break-all">{selected.email}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <p className="text-slate-400 font-bold">{t('detailPhone')}</p>
                      <p className="font-extrabold text-slate-900 dark:text-white">{selected.phone ?? '—'}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <p className="text-slate-400 font-bold">{t('role')}</p>
                      <p className="font-extrabold text-slate-900 dark:text-white">{selected.role}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                      <p className="text-slate-400 font-bold">{t('status')}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_STYLE[selected.status]}`}>
                        {selected.status}
                      </span>
                    </div>
                  </div>

                  {selected.clientProfile && (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 space-y-1 text-xs">
                      <p className="font-extrabold text-blue-700 dark:text-blue-300">{t('detailClientProfile')}</p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {selected.clientProfile.firstName} {selected.clientProfile.lastName}
                      </p>
                    </div>
                  )}

                  {selected.masterProfile && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 space-y-1 text-xs">
                      <p className="font-extrabold text-amber-700 dark:text-amber-300">{t('detailMasterProfile')}</p>
                      <p className="text-slate-700 dark:text-slate-300">{selected.masterProfile.displayName}</p>
                      <p className="text-slate-500">
                        {t('detailApprovalStatus')}: {selected.masterProfile.approvalStatus} · {t('detailRating')}:{' '}
                        {selected.masterProfile.ratingAverage} ({selected.masterProfile.ratingCount}) · {t('detailCompletedJobs')}:{' '}
                        {selected.masterProfile.completedBookingsCount}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
