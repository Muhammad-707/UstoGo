'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi, categoriesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Category } from '@/lib/api/types';

const EMPTY_FORM = { id: '', name: '', slug: '', parentId: '', description: '', sortOrder: '0', isActive: true };

interface FlatCategory extends Category {
  depth: number;
}

function flatten(nodes: Category[], depth = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flatten(node.children, depth + 1) : []),
  ]);
}

export default function AdminCategoriesPage() {
  const t = useTranslations('adminCategories');
  useRequireAuth(['ADMIN']);

  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    categoriesApi
      .tree()
      .then(setTree)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the category tree on mount
  useEffect(load, []);

  const flat = flatten(tree);

  const openCreate = (parentId = '') => {
    setForm({ ...EMPTY_FORM, parentId });
    setFormOpen(true);
  };

  const openEdit = (category: FlatCategory) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parentId: category.ancestors?.[category.ancestors.length - 1]?.id ?? '',
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      isActive: true,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await adminApi.categories.update(form.id, {
          name: form.name.trim(),
          parentId: form.parentId || null,
          description: form.description.trim() || undefined,
          sortOrder: Number(form.sortOrder) || 0,
          isActive: form.isActive,
        });
      } else {
        await adminApi.categories.create({
          name: form.name.trim(),
          slug: form.slug.trim(),
          parentId: form.parentId || undefined,
          description: form.description.trim() || undefined,
          sortOrder: Number(form.sortOrder) || 0,
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
      await adminApi.categories.remove(id);
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
          <button onClick={() => openCreate()} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition">
            <Icon name="plus" size={14} />
            {t('addCategory')}
          </button>
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

      <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
        {t('inactiveHiddenNote')}
      </div>

      {formOpen && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{form.id ? t('editCategory') : t('addCategory')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <input placeholder={t('nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <input placeholder={t('slugLabel')} value={form.slug} disabled={!!form.id} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold disabled:opacity-50" />
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
              <option value="">{t('rootCategory')}</option>
              {flat.filter((c) => c.id !== form.id).map((c) => (
                <option key={c.id} value={c.id}>{'— '.repeat(c.depth)}{c.name}</option>
              ))}
            </select>
            <input placeholder={t('sortOrderLabel')} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <textarea rows={2} placeholder={t('descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2" />
            {form.id && (
              <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                {t('isActiveLabel')}
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-success px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60 transition">
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
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />)}
          </div>
        )}
        {!loading && flat.length === 0 && <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>}
        {!loading && flat.length > 0 && (
          <div className="space-y-1.5">
            {flat.map((c) => (
              <div
                key={c.id}
                style={{ marginLeft: `${c.depth * 20}px` }}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold text-slate-900 dark:text-white truncate ${c.isLeaf ? '' : 'text-purple-600 dark:text-purple-400'}`}>
                    {c.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{c.slug}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openCreate(c.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition">{t('addChild')}</button>
                  <button onClick={() => openEdit(c)} className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold transition">{t('edit')}</button>
                  <button onClick={() => handleDelete(c.id)} className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition">{t('delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
