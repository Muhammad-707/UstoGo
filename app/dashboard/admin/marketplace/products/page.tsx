'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { Paginated, Product, ProductCategory } from '@/lib/api/types';
import { useMoney } from '@/lib/money';

const EMPTY_FORM = {
  id: '',
  categoryId: '',
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  imageUrls: '',
  isActive: true,
};

export default function AdminProductsPage() {
  const t = useTranslations('adminMarketplaceProducts');
  const { money } = useMoney();
  useRequireAuth(['ADMIN']);

  const [result, setResult] = useState<Paginated<Product> | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.products
      .list({ page, limit: 15 })
      .then(setResult)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches products on page change
  useEffect(load, [page]);
  useEffect(() => {
    adminApi.productCategories.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setFormOpen(true);
  };

  const openEdit = (product: Product) => {
    setForm({
      id: product.id,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice ?? '',
      imageUrls: product.imageUrls.join('\n'),
      isActive: product.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const imageUrls = form.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean);
      const data = {
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        oldPrice: form.oldPrice ? Number(form.oldPrice) : undefined,
        imageUrls,
        isActive: form.isActive,
      };
      if (form.id) {
        await adminApi.products.update(form.id, data);
      } else {
        await adminApi.products.create(data);
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
      await adminApi.products.remove(id);
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
          <button onClick={openCreate} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur text-white text-xs font-bold transition">
            <Icon name="plus" size={14} />
            {t('addProduct')}
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

      {formOpen && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{form.id ? t('editProduct') : t('addProduct')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <input placeholder={t('nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2" />
            <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
              <option value="">{t('selectCategory')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              {t('isActiveLabel')}
            </label>
            <input placeholder={t('priceLabel')} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <input placeholder={t('oldPriceLabel')} type="number" step="0.01" value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <textarea rows={3} placeholder={t('descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2" />
            <textarea rows={3} placeholder={t('imageUrlsLabel')} value={form.imageUrls} onChange={(e) => setForm({ ...form, imageUrls: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2 font-mono" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />)}
          </div>
        )}
        {!loading && (!result || result.items.length === 0) && <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>}
        {!loading && result && result.items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.items.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex gap-3">
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {p.imageUrls[0] ? <img src={p.imageUrls[0]} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Icon name="package" size={20} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-2">
                    {p.name}
                    {!p.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold shrink-0">{t('inactive')}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400">{p.categoryName}</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                    {money(p.price)}
                    {p.oldPrice && <span className="text-slate-400 line-through ml-2">{p.oldPrice}</span>}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => openEdit(p)} className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition">{t('edit')}</button>
                    <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition">{t('delete')}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && result && result.meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40">{t('prev')}</button>
            <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: result.meta.totalPages })}</span>
            <button onClick={() => setPage((p) => Math.min(result.meta.totalPages, p + 1))} disabled={page >= result.meta.totalPages} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40">{t('next')}</button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
