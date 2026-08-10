'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { citiesApi, savedAddressesApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { City, SavedAddress } from '@/lib/api/types';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';

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
          <button
            onClick={() => setShowForm(true)}
            disabled={addresses.length >= 10}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2"
          >
            <Icon name="Calendar" size={14} />
            {t('addAddress')}
          </button>
        )
      }
    />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
      {loading && <p className="text-xs text-slate-400 font-semibold">{t('loading')}</p>}

      {showForm && (
        <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">{t('labelLabel')}</span>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder={t('labelPlaceholder')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
            <label className="space-y-1.5">
              <span className="font-bold text-slate-500">{t('cityLabel')}</span>
              <select
                value={form.cityId}
                onChange={(e) => setForm((f) => ({ ...f, cityId: e.target.value, district: '' }))}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <option value="">{t('selectCity')}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="font-bold text-slate-500">{t('districtLabel')}</span>
              {activeCity?.districts && activeCity.districts.length > 0 ? (
                <select
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="">{t('selectDistrict')}</option>
                  {activeCity.districts.map((d) => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                />
              )}
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="font-bold text-slate-500">{t('lineLabel')}</span>
              <input
                type="text"
                value={form.line}
                onChange={(e) => setForm((f) => ({ ...f, line: e.target.value }))}
                placeholder={t('linePlaceholder')}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
            <label className="space-y-1.5">
              <span className="font-bold text-slate-500">{t('phoneLabel')}</span>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                placeholder="+992 __ ___-__-__"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md disabled:opacity-60 transition"
            >
              {saving ? t('saving') : t('save')}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {!loading && addresses.length === 0 && !showForm && (
        <div className="glass-card rounded-3xl p-12 text-center space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('empty')}</p>
        </div>
      )}

      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between gap-4"
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
                <button
                  onClick={() => handleSetDefault(address)}
                  className="text-[11px] font-bold text-blue-600 dark:text-sky-400 hover:underline"
                >
                  {t('makeDefault')}
                </button>
              )}
              <button
                onClick={() => startEdit(address)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label={t('edit')}
              >
                <Icon name="filetext" size={14} />
              </button>
              <button
                onClick={() => handleRemove(address)}
                className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                aria-label={t('delete')}
              >
                <Icon name="X" size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
