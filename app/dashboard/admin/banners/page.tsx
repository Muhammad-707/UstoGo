'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { uploadFile } from '@/lib/api/upload';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BANNER_POSITIONS, type Banner, type BannerPosition } from '@/lib/api/types';

interface FormState {
  id: string;
  title: string;
  subtitle: string;
  imageKey: string;
  imagePreview: string | null;
  linkUrl: string;
  position: BannerPosition;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  id: '',
  title: '',
  subtitle: '',
  imageKey: '',
  imagePreview: null,
  linkUrl: '',
  position: 'HOME_TOP',
  sortOrder: '0',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

/** `2026-08-09T14:30:00.000Z` -> `2026-08-09T14:30`, what datetime-local expects. */
const toLocalInput = (iso?: string | null) => (iso ? iso.slice(0, 16) : '');

export default function AdminBannersPage() {
  const t = useTranslations('adminBanners');
  useRequireAuth(['ADMIN']);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    adminApi.banners
      .list({ limit: 50 })
      .then((res) => setBanners(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches banners on mount
  useEffect(load, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setForm({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      imageKey: '',
      imagePreview: banner.imageUrl,
      linkUrl: banner.linkUrl ?? '',
      position: banner.position,
      sortOrder: String(banner.sortOrder),
      startsAt: toLocalInput(banner.startsAt),
      endsAt: toLocalInput(banner.endsAt),
      isActive: banner.isActive,
    });
    setError(null);
    setFormOpen(true);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fileId = await uploadFile(file, 'BANNER');
      setForm((prev) => ({ ...prev, imageKey: fileId, imagePreview: URL.createObjectURL(file) }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError(t('titleRequired'));
      return;
    }
    if (!form.id && !form.imageKey) {
      setError(t('imageRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const common = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        linkUrl: form.linkUrl.trim() || undefined,
        position: form.position,
        sortOrder: Number(form.sortOrder) || 0,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        isActive: form.isActive,
      };
      if (form.id) {
        // imageKey is only sent when a new file was actually picked — the backend
        // releases the previous image whenever this field is present.
        await adminApi.banners.update(form.id, {
          ...common,
          ...(form.imageKey ? { imageKey: form.imageKey } : {}),
        });
      } else {
        await adminApi.banners.create({ ...common, imageKey: form.imageKey });
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    try {
      await adminApi.banners.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteFailed'));
    }
  };

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition"
          >
            <Icon name="plus" size={14} />
            {t('addBanner')}
          </button>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition"
          >
            <Icon name="chevronleft" size={14} />
            {t('back')}
          </Link>
        </div>
      }
    >
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {formOpen && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {form.id ? t('editBanner') : t('addBanner')}
          </h3>

          <div className="flex flex-col sm:flex-row gap-5">
            <div className="w-full sm:w-64 shrink-0 space-y-2">
              <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="image" size={28} className="text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-60 transition"
              >
                {uploading ? t('uploading') : form.imagePreview ? t('replaceImage') : t('uploadImage')}
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <input
                placeholder={t('titleLabel')}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2"
              />
              <input
                placeholder={t('subtitleLabel')}
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2"
              />
              <input
                placeholder={t('linkUrlLabel')}
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2"
              />
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value as BannerPosition })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {BANNER_POSITIONS.map((p) => <option key={p} value={p}>{t(`position${p}`)}</option>)}
              </select>
              <input
                type="number"
                placeholder={t('sortOrderLabel')}
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('startsAtLabel')}</span>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-500">{t('endsAtLabel')}</span>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              </label>
              <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                {t('isActiveLabel')}
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || uploading} className="btn-success px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60 transition">
              {saving ? '...' : t('save')}
            </button>
            <button onClick={() => setFormOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="h-40 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && banners.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>
        )}

        {!loading && banners.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {banners.map((banner) => (
              <div key={banner.id} className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                <div className="aspect-[16/9] bg-slate-200 dark:bg-slate-700 relative">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Icon name="image" size={26} />
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-slate-900/75 text-white text-[10px] font-extrabold backdrop-blur">
                    {t(`position${banner.position}`)}
                  </span>
                  {!banner.isActive && (
                    <span className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-slate-700 text-white text-[10px] font-extrabold">
                      {t('inactive')}
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1">{banner.title}</p>
                  {banner.subtitle && <p className="text-[11px] text-slate-500 line-clamp-1">{banner.subtitle}</p>}
                  <p className="text-[10px] text-slate-400">
                    {t('windowLabel')}: {banner.startsAt ? new Date(banner.startsAt).toLocaleDateString() : '∞'} — {banner.endsAt ? new Date(banner.endsAt).toLocaleDateString() : '∞'}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => openEdit(banner)} className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">
                      {t('edit')}
                    </button>
                    <button onClick={() => handleDelete(banner.id)} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">
                      {t('delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
