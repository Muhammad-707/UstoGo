'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi, citiesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { City, MarketplaceShop } from '@/lib/api/types';

const EMPTY_FORM = { id: '', name: '', address: '', cityId: '', latitude: '', longitude: '', phone: '', isActive: true };

export default function AdminMarketplaceShopsPage() {
  const t = useTranslations('adminMarketplaceShops');
  useRequireAuth(['ADMIN']);

  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    adminApi.marketplaceShops
      .list()
      .then(setShops)
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadFailed')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches shops and cities on mount
    load();
    citiesApi.list().then(setCities).catch(() => setCities([]));
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (shop: MarketplaceShop) => {
    setForm({
      id: shop.id,
      name: shop.name,
      address: shop.address,
      cityId: shop.cityId,
      latitude: String(shop.latitude),
      longitude: String(shop.longitude),
      phone: shop.phone ?? '',
      isActive: shop.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name.trim(),
        address: form.address.trim(),
        cityId: form.cityId,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        phone: form.phone.trim() || undefined,
        isActive: form.isActive,
      };
      if (form.id) {
        await adminApi.marketplaceShops.update(form.id, data);
      } else {
        await adminApi.marketplaceShops.create(data);
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
      await adminApi.marketplaceShops.remove(id);
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
            {t('addShop')}
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
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{form.id ? t('editShop') : t('addShop')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <input placeholder={t('nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <select value={form.cityId} onChange={(e) => setForm({ ...form, cityId: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold">
              <option value="">{t('selectCity')}</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input placeholder={t('addressLabel')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold sm:col-span-2" />
            <input placeholder={t('latitudeLabel')} type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <input placeholder={t('longitudeLabel')} type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <input placeholder={t('phoneLabel')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold" />
            <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              {t('isActiveLabel')}
            </label>
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
            {Array.from({ length: 3 }).map((_, idx) => <div key={idx} className="h-20 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />)}
          </div>
        )}
        {!loading && shops.length === 0 && <p className="text-xs text-slate-400 font-semibold text-center py-10">{t('noResults')}</p>}
        {!loading && shops.length > 0 && (
          <div className="space-y-3">
            {shops.map((shop) => (
              <div key={shop.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {shop.name}
                    {!shop.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">{t('inactive')}</span>}
                  </p>
                  <p className="text-[11px] text-slate-500">{shop.address} · {shop.cityName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(shop)} className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">{t('edit')}</button>
                  <button onClick={() => handleDelete(shop.id)} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">{t('delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
