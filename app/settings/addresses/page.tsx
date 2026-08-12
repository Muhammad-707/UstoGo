'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { citiesApi, savedAddressesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { City, SavedAddress } from '@/lib/api/types';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface AddressFormState {
  label: string;
  cityId: string;
  district: string;
  line: string;
  contactPhone: string;
}

const EMPTY_FORM: AddressFormState = { label: '', cityId: '', district: '', line: '', contactPhone: '' };

export default function SavedAddressesPage() {
  const t = useTranslations('settingsAddresses');

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCity = cities.find((c) => c.id === form.cityId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [addr, cityList] = await Promise.all([savedAddressesApi.list(), citiesApi.list()]);
      setAddresses(addr);
      setCities(cityList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches addresses on mount
    load();
  }, [load]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (address: SavedAddress) => {
    setForm({
      label: address.label,
      cityId: address.cityId,
      district: address.addressDistrict,
      line: address.addressLine,
      contactPhone: address.contactPhone ?? '',
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.cityId || !form.district.trim() || !form.line.trim()) {
      setError(t('validationRequired'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        label: form.label.trim(),
        cityId: form.cityId,
        district: form.district.trim(),
        line: form.line.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
      };
      if (editingId !== null) {
        const updated = await savedAddressesApi.update(editingId, payload);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
      } else {
        const created = await savedAddressesApi.create(payload);
        setAddresses((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address: SavedAddress) => {
    setError(null);
    try {
      const updated = await savedAddressesApi.update(address.id, { isDefault: true });
      setAddresses((prev) => prev.map((a) => (a.id === address.id ? updated : { ...a, isDefault: false })));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('saveFailed'));
    }
  };

  const handleRemove = async (address: SavedAddress) => {
    if (!window.confirm(t('confirmDelete', { label: address.label }))) return;
    setError(null);
    try {
      await savedAddressesApi.remove(address.id);
      setAddresses((prev) => prev.filter((a) => a.id !== address.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('deleteFailed'));
    }
  };

  return (
    <>
    <ClientPageHeader
      icon="mappin"
      eyebrow={t('badge')}
      title={t('title')}
      hint={t('pageHint')}
      action={
        !showForm && (
          <Button
            variant="brand"
            onClick={() => setShowForm(true)}
            disabled={addresses.length >= 10}
            className="h-auto px-5 py-2.5 rounded-xl text-xs shadow-md gap-2"
          >
            <Icon name="Calendar" size={14} />
            {t('addAddress')}
          </Button>
        )
      }
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}

      {showForm && (
        <Card className="gap-0 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address-label" className="text-slate-500">{t('labelLabel')}</Label>
              <Input
                id="address-label"
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={t('labelPlaceholder')}
                className="p-3 rounded-xl font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-city" className="text-slate-500">{t('cityLabel')}</Label>
              <Select
                value={form.cityId}
                onValueChange={(value) => setForm((f) => ({ ...f, cityId: value, district: '' }))}
              >
                <SelectTrigger id="address-city" className="w-full p-3 rounded-xl font-semibold">
                  <SelectValue placeholder={t('selectCity')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-district" className="text-slate-500">{t('districtLabel')}</Label>
              {activeCity?.districts && activeCity.districts.length > 0 ? (
                <Select
                  value={form.district}
                  onValueChange={(value) => setForm((f) => ({ ...f, district: value }))}
                >
                  <SelectTrigger id="address-district" className="w-full p-3 rounded-xl font-semibold">
                    <SelectValue placeholder={t('selectDistrict')} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCity.districts.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="address-district"
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="p-3 rounded-xl font-semibold"
                />
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address-line" className="text-slate-500">{t('lineLabel')}</Label>
              <Input
                id="address-line"
                type="text"
                value={form.line}
                onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
                placeholder={t('linePlaceholder')}
                className="p-3 rounded-xl font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address-phone" className="text-slate-500">{t('phoneLabel')}</Label>
              <Input
                id="address-phone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+992 __ ___-__-__"
                className="p-3 rounded-xl font-semibold"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="brand" onClick={handleSave} disabled={saving} className="h-auto px-6 py-3 rounded-2xl text-xs shadow-md">
              {saving ? t('saving') : t('save')}
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="h-auto px-6 py-3 rounded-2xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t('cancel')}
            </Button>
          </div>
        </Card>
      )}

      {!loading && addresses.length === 0 && !showForm && (
        <Card className="gap-0 rounded-3xl p-12 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('empty')}</p>
        </Card>
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <Card
            key={address.id}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{address.label}</h3>
                {address.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                    {t('defaultBadge')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {address.addressDistrict}, {address.addressLine}
              </p>
              {address.contactPhone && <p className="text-xs text-slate-400 mt-0.5">{address.contactPhone}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!address.isDefault && (
                <Button
                  variant="link"
                  onClick={() => handleSetDefault(address)}
                  className="h-auto p-0 text-[11px] font-bold text-blue-600 dark:text-sky-400"
                >
                  {t('makeDefault')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => startEdit(address)}
                className="rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label={t('edit')}
              >
                <Icon name="filetext" size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemove(address)}
                className="rounded-lg text-red-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                aria-label={t('delete')}
              >
                <Icon name="X" size={14} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}
