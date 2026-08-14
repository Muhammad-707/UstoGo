'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { adminApi, citiesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import type { City, MarketplaceShop } from '@/lib/api/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

const ShopLocationPicker = dynamic(() => import('@/components/marketplace/ShopLocationPicker'), {
  ssr: false,
  loading: () => <Skeleton className="h-[300px] w-full rounded-2xl" />,
});

const EMPTY_FORM = {
  id: '',
  name: '',
  description: '',
  address: '',
  cityId: '',
  latitude: null as number | null,
  longitude: null as number | null,
  phone: '',
  workingHours: '',
  isActive: true,
};

const INPUT_CLASS =
  'p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold';

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
      description: shop.description ?? '',
      address: shop.address,
      cityId: shop.cityId,
      latitude: shop.latitude,
      longitude: shop.longitude,
      phone: shop.phone ?? '',
      workingHours: shop.workingHours ?? '',
      isActive: shop.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (form.latitude == null || form.longitude == null) {
      setError(t('pickPointFirst'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        address: form.address.trim(),
        cityId: form.cityId,
        latitude: form.latitude,
        longitude: form.longitude,
        phone: form.phone.trim() || undefined,
        workingHours: form.workingHours.trim() || undefined,
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

  // Picking a city before placing the pin recentres the map on it, so the admin is not
  // hunting for Khorog starting from Dushanbe. `City` coordinates arrive as strings.
  const selectedCity = cities.find((city) => city.id === form.cityId);
  const cityCenter: [number, number] | null =
    selectedCity?.latitude != null && selectedCity.longitude != null
      ? [Number(selectedCity.latitude), Number(selectedCity.longitude)]
      : null;

  return (
    <DashboardLayout
      role="ADMIN"
      title={t('title')}
      subtitle={t('subtitle')}
      action={
        <div className="flex items-center gap-2">
          <Button size="raw" variant="ghost"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <Icon name="plus" size={14} />
            {t('addShop')}
          </Button>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white"
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
        <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{form.id ? t('editShop') : t('addShop')}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input placeholder={t('nameLabel')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT_CLASS} />
            <Select value={form.cityId || ANY} onValueChange={(raw) => { const value = raw === ANY ? '' : raw; setForm({ ...form, cityId: value }); }}>
              <SelectTrigger className="w-auto INPUT_CLASS">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t('selectCity')}</SelectItem>
              
              {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder={t('addressLabel')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${INPUT_CLASS} sm:col-span-2`} />
            <Textarea placeholder={t('descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${INPUT_CLASS} sm:col-span-2 resize-y`} />
            <Input placeholder={t('phoneLabel')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={INPUT_CLASS} />
            <Input placeholder={t('workingHoursLabel')} value={form.workingHours} onChange={(e) => setForm({ ...form, workingHours: e.target.value })} className={INPUT_CLASS} />
            <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
              <Checkbox checked={form.isActive} onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })} className="size-4" />
              {t('isActiveLabel')}
            </label>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{t('pickPointLabel')}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('pickPointHint')}</p>
            <ShopLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              fallbackCenter={cityCenter}
              onPick={(latitude, longitude) => setForm((prev) => ({ ...prev, latitude, longitude }))}
            />
            <p className="text-[10px] font-mono text-slate-400">
              {form.latitude != null && form.longitude != null
                ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)}`
                : t('noPointYet')}
            </p>
          </div>

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
            {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-20 rounded-2xl" />)}
          </div>
        )}
        {!loading && shops.length === 0 && <EmptyState icon="store" title={t('noResults')} />}
        {!loading && shops.length > 0 && (
          <div className="space-y-3">
            {shops.map((shop) => (
              <div key={shop.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    {shop.name}
                    {!shop.isActive && <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">{t('inactive')}</span>}
                  </p>
                  <p className="text-[11px] text-slate-500">{shop.address} · {shop.cityName}</p>
                  {shop.workingHours && <p className="text-[11px] text-slate-400">{shop.workingHours}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="raw" variant="ghost" onClick={() => openEdit(shop)} className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition">{t('edit')}</Button>
                  <Button size="raw" variant="ghost" onClick={() => handleDelete(shop.id)} className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition">{t('delete')}</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
