'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { masterCabinetApi, categoriesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { MasterService, Category } from '@/lib/api/types';

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => (c.isLeaf ? [c] : flattenCategories(c.children ?? [])));
}

export default function MasterServicesPage() {
  const t = useTranslations('settingsServices');

  const [services, setServices] = useState<MasterService[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([masterCabinetApi.myServices(), categoriesApi.tree()])
      .then(([svc, cats]) => {
        setServices(svc);
        const leaves = flattenCategories(cats);
        setCategories(leaves);
        if (leaves.length > 0) setCategoryId(leaves[0].id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load services.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !categoryId || !price) return;
    setAdding(true);
    setError(null);
    try {
      const created = await masterCabinetApi.createService({
        categoryId,
        title,
        priceType: 'FIXED',
        price: Number(price),
        currency: 'USD',
        durationMinutes: Number(durationMinutes) || 60,
      });
      setServices((prev) => [...prev, created]);
      setTitle('');
      setPrice('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add service.');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await masterCabinetApi.removeService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to remove service.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
            {t('catalogManagement')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('servicesPricing')}</h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md"
        >
          {t('addService')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              placeholder={t('addService')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
            <input
              type="number"
              placeholder="Duration (min)"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md disabled:opacity-60"
          >
            {t('addService')}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        {loading && <p className="text-xs text-slate-400 font-semibold">Loading…</p>}
        {!loading && services.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">No services added yet.</p>
        )}
        {services.map((s) => (
          <div key={s.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.title}</h3>
              <p className="text-slate-400">{t('estimatedDuration', { est: `${s.durationMinutes} min` })}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-extrabold text-blue-600 dark:text-sky-400 text-sm">{s.price} {s.currency}</span>
              <button onClick={() => handleRemove(s.id)} className="text-slate-400 hover:text-red-500 font-bold">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
