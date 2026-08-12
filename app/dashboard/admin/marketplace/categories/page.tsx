'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { ProductCategory } from '@/lib/api/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

const EMPTY_FORM = { id: '', name: '', slug: '', sortOrder: '0', isActive: true };

export default function AdminProductCategoriesPage() {
  const t = useTranslations('adminMarketplaceCategories');
  useRequireAuth(['ADMIN']);

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.productCategories
      .list()
      .then(setCategories)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches categories on mount
  useEffect(load, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (category: ProductCategory) => {
    setForm({ id: category.id, name: category.name, slug: category.slug, sortOrder: String(category.sortOrder), isActive: category.isActive });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await adminApi.productCategories.update(form.id, {
          name: form.name.trim(),
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        });
      } else {
        await adminApi.productCategories.create({
          name: form.name.trim(),
          slug: form.slug.trim(),
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        });
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
      await adminApi.productCategories.remove(id);
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
          <Button size="raw" variant="ghost" onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition">
            <Icon name="plus" size={14} />
            {t('addCategory')}
          </Button>
          <Link href="/dashboard/admin" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition">
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
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{form.id ? t('editCategory') : t('addCategory')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <Input placeholder={t('nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <Input placeholder={t('slugLabel')} value={form.slug} disabled={!!form.id} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-50" />
            <Input placeholder={t('sortOrderLabel')} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Checkbox checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })} className="size-4" />
              {t('isActiveLabel')}
            </label>
          </div>
          {form.id && <p className="text-[10px] text-slate-400">{t('slugImmutableHint')}</p>}
          <div className="flex items-center gap-2">
            <Button size="raw" variant="ghost" onClick={handleSave} disabled={saving} className="btn-success px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60 transition">
              {saving ? '...' : t('save')}
            </Button>
            <Button size="raw" variant="ghost" onClick={() => setFormOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">
              {t('cancel')}
            </Button>
          </div>
        </Card>
      )}

      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="h-16 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />)}
          </div>
        )}
        {!loading && categories.length === 0 && <EmptyState icon="tag" title={t('noResults')} />}
        {!loading && categories.length > 0 && (
          <div className="space-y-2">
            {categories.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {c.name}
                    {!c.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">{t('inactive')}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">{c.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="raw" variant="ghost" onClick={() => openEdit(c)} className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">{t('edit')}</Button>
                  <Button size="raw" variant="ghost" onClick={() => handleDelete(c.id)} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">{t('delete')}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
