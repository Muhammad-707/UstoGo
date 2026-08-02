'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { categoriesApi, masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Category, MasterService } from '@/lib/api/types';

type PriceType = 'FIXED' | 'HOURLY' | 'FROM';

const PRICE_TYPES: PriceType[] = ['FIXED', 'HOURLY', 'FROM'];

function flattenCategories(cats: Category[]): Category[] {
  return cats.flatMap((c) => (c.isLeaf ? [c] : flattenCategories(c.children ?? [])));
}

interface ServiceFormState {
  categoryId: string;
  title: string;
  description: string;
  priceType: PriceType;
  price: string;
  durationMinutes: string;
}

const EMPTY_FORM: ServiceFormState = {
  categoryId: '',
  title: '',
  description: '',
  priceType: 'FIXED',
  price: '',
  durationMinutes: '60',
};

export default function MasterServicesPage() {
  const t = useTranslations('settingsServices');

  const [services, setServices] = useState<MasterService[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [myCategoryIds, setMyCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ServiceFormState>(EMPTY_FORM);
  const [attachCategoryId, setAttachCategoryId] = useState('');

  const myCategories = useMemo(() => {
    const byId = new Map(allCategories.map((c) => [c.id, c]));
    return myCategoryIds.map((id) => byId.get(id)).filter((c): c is Category => c !== undefined);
  }, [allCategories, myCategoryIds]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [svc, cats, ids] = await Promise.all([
        masterCabinetApi.myServices(),
        categoriesApi.tree(),
        masterCabinetApi.myCategories(),
      ]);
      setServices(svc);
      setAllCategories(flattenCategories(cats));
      setMyCategoryIds(ids);
      if (ids.length > 0) {
        setForm((f) => (f.categoryId ? f : { ...f, categoryId: ids[0] }));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, categoryId: myCategoryIds[0] ?? '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (service: MasterService) => {
    setForm({
      categoryId: service.categoryId,
      title: service.title,
      description: service.description ?? '',
      priceType: (PRICE_TYPES.includes(service.priceType as PriceType) ? service.priceType : 'FIXED') as PriceType,
      price: service.price,
      durationMinutes: String(service.durationMinutes),
    });
    setEditingId(service.id);
    setShowForm(true);
  };

  const validate = (): string | null => {
    const price = Number(form.price);
    if (!form.title.trim()) return t('validationTitleRequired');
    if (!form.categoryId) return t('validationCategoryRequired');
    if (!Number.isFinite(price) || price <= 0) return t('validationPriceInvalid');
    const minutes = Number(form.durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 15 || minutes % 15 !== 0) {
      return t('validationDurationInvalid');
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        categoryId: form.categoryId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        priceType: form.priceType,
        price: Number(form.price),
        durationMinutes: Number(form.durationMinutes),
      };
      if (editingId !== null) {
        const updated = await masterCabinetApi.updateService(editingId, payload);
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await masterCabinetApi.createService(payload);
        setServices((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: MasterService) => {
    setError(null);
    try {
      const updated = await masterCabinetApi.updateService(service.id, {
        isActive: !(service.isActive ?? true),
      });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    }
  };

  const handleRemove = async (service: MasterService) => {
    if (!window.confirm(t('confirmDeleteService', { title: service.title }))) return;
    setError(null);
    try {
      await masterCabinetApi.removeService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteFailed'));
    }
  };

  const handleAttachCategory = async () => {
    if (!attachCategoryId) return;
    setError(null);
    try {
      await masterCabinetApi.attachCategory(attachCategoryId);
      setMyCategoryIds((prev) => [...prev, attachCategoryId]);
      setForm((f) => ({ ...f, categoryId: attachCategoryId }));
      setAttachCategoryId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('attachFailed'));
    }
  };

  const handleDetachCategory = async (id: string) => {
    setError(null);
    try {
      await masterCabinetApi.detachCategory(id);
      const remaining = myCategoryIds.filter((c) => c !== id);
      setMyCategoryIds(remaining);
      setForm((f) => (f.categoryId === id ? { ...f, categoryId: remaining[0] ?? '' } : f));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detachFailed'));
    }
  };

  const unattachedLeaves = useMemo(
    () => allCategories.filter((c) => !myCategoryIds.includes(c.id)),
    [allCategories, myCategoryIds],
  );

  const durationHint = form.durationMinutes
    ? `${Math.floor(Number(form.durationMinutes) / 60)}h ${Number(form.durationMinutes) % 60}m`
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {t('catalogManagement')}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{t('servicesPricing')}</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">{t('pageHint')}</p>
        </div>
        <button
          onClick={() => {
            if (myCategoryIds.length === 0) {
              setError(t('noCategoryAttached'));
              return;
            }
            setShowForm((s) => !s);
            if (!showForm) {
              setEditingId(null);
              setForm({ ...EMPTY_FORM, categoryId: myCategoryIds[0] });
            }
          }}
          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition"
        >
          {t('addService')}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* My categories */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{t('myCategories')}</h3>
        {myCategories.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">{t('noCategoryAttached')}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {myCategories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-xs font-bold"
            >
              {c.name}
              <button onClick={() => handleDetachCategory(c.id)} className="hover:text-red-500" title={t('detach')}>
                ×
              </button>
            </span>
          ))}
        </div>
        {unattachedLeaves.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={attachCategoryId}
              onChange={(e) => setAttachCategoryId(e.target.value)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
            >
              <option value="">{t('selectCategoryToAttach')}</option>
              {unattachedLeaves.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleAttachCategory}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950 transition"
            >
              {t('attach')}
            </button>
          </div>
        )}
      </div>

      {/* Add / edit form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-amber-200 dark:border-amber-800/40 p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {editingId !== null ? t('editService') : t('newService')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <label className="space-y-1">
              <span className="font-bold text-slate-500">{t('titleLabel')}</span>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">{t('categoryLabel')}</span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {myCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="font-bold text-slate-500">{t('descriptionLabel')}</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">{t('priceTypeLabel')}</span>
              <select
                value={form.priceType}
                onChange={(e) => setForm((f) => ({ ...f, priceType: e.target.value as PriceType }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {PRICE_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t(`priceType${pt}`)}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">{t('priceLabel')}</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
            <label className="space-y-1">
              <span className="font-bold text-slate-500">{t('durationLabel')}</span>
              <input
                type="number"
                min="15"
                step="15"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
              {durationHint && <span className="text-[10px] text-slate-400 font-bold">{durationHint}</span>}
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md disabled:opacity-60 transition"
            >
              {saving ? t('saving') : t('save')}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
          {t('myServicesTitle', { count: services.length })}
        </h3>
        {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}
        {!loading && services.length === 0 && (
          <p className="text-xs text-slate-400 font-semibold">{t('noServices')}</p>
        )}
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${(s.isActive ?? true) ? '' : 'opacity-60'}`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{s.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                    {myCategories.find((c) => c.id === s.categoryId)?.name ?? '—'}
                  </span>
                </div>
                {s.description && <p className="text-slate-500 line-clamp-2">{s.description}</p>}
                <p className="text-slate-400">
                  {t('estimatedDuration', { est: `${s.durationMinutes} min` })} ·{' '}
                  {t(`priceType${(PRICE_TYPES.includes(s.priceType as PriceType) ? s.priceType : 'FIXED')}`)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{s.price} {s.currency}</span>
                <button
                  onClick={() => handleToggleActive(s)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition ${
                    (s.isActive ?? true)
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {(s.isActive ?? true) ? t('active') : t('inactive')}
                </button>
                <button onClick={() => startEdit(s)} className="text-slate-400 hover:text-amber-600 font-bold">
                  {t('edit')}
                </button>
                <button onClick={() => handleRemove(s)} className="text-slate-400 hover:text-red-500 font-bold">
                  {t('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
