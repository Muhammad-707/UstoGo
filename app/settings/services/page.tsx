'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { categoriesApi, masterCabinetApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import { revalidateMastersCache } from '@/lib/api/revalidate';
import type { Category, MasterService, PricingSuggestion } from '@/lib/api/types';
import { MasterPageHeader } from '@/components/master/MasterPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [priceSuggestion, setPriceSuggestion] = useState<PricingSuggestion | null>(null);

  useEffect(() => {
    if (!showForm || !form.categoryId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears a stale suggestion when the form closes or the category changes
      setPriceSuggestion(null);
      return;
    }
    let cancelled = false;
    masterCabinetApi
      .pricingSuggestion(form.categoryId)
      .then((data) => {
        if (!cancelled) setPriceSuggestion(data.sampleSize > 0 ? data : null);
      })
      .catch(() => {
        if (!cancelled) setPriceSuggestion(null);
      });
    return () => {
      cancelled = true;
    };
  }, [showForm, form.categoryId]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches services on mount
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
      revalidateMastersCache();
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
      revalidateMastersCache();
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
      revalidateMastersCache();
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
    <>
    <MasterPageHeader
      icon="briefcase"
      eyebrow={t('catalogManagement')}
      title={t('servicesPricing')}
      hint={t('pageHint')}
      action={
        <Button
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
          className="h-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs shadow-lg shadow-amber-900/20"
        >
          + {t('addService')}
        </Button>
      }
    />
    <div className="page-shell page-shell-narrow py-10 space-y-8">

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* My categories */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="award" size={16} className="text-amber-500" />
          {t('myCategories')}
        </h3>
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
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDetachCategory(c.id)}
                className="hover:text-red-500 hover:bg-transparent"
                title={t('detach')}
              >
                ×
              </Button>
            </span>
          ))}
        </div>
        {unattachedLeaves.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Select value={attachCategoryId} onValueChange={setAttachCategoryId}>
              <SelectTrigger className="w-auto min-w-56 p-2.5 rounded-xl font-semibold">
                <SelectValue placeholder={t('selectCategoryToAttach')} />
              </SelectTrigger>
              <SelectContent>
                {unattachedLeaves.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              onClick={handleAttachCategory}
              className="h-auto px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-amber-100 dark:hover:bg-amber-950"
            >
              {t('attach')}
            </Button>
          </div>
        )}
      </Card>

      {/* Add / edit form */}
      {showForm && (
        <Card className="rounded-3xl border border-amber-200 dark:border-amber-800/40 p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            {editingId !== null ? t('editService') : t('newService')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <Label htmlFor="service-title" className="text-slate-500">{t('titleLabel')}</Label>
              <Input
                id="service-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="p-3 rounded-xl font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="service-category" className="text-slate-500">{t('categoryLabel')}</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => setForm((f) => ({ ...f, categoryId: value }))}
              >
                <SelectTrigger id="service-category" className="w-full p-3 rounded-xl font-semibold">
                  <SelectValue placeholder={t('categoryLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {myCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="service-description" className="text-slate-500">{t('descriptionLabel')}</Label>
              <Textarea
                id="service-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="p-3 rounded-xl font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="service-price-type" className="text-slate-500">{t('priceTypeLabel')}</Label>
              <Select
                value={form.priceType}
                onValueChange={(value) => setForm((f) => ({ ...f, priceType: value as PriceType }))}
              >
                <SelectTrigger id="service-price-type" className="w-full p-3 rounded-xl font-semibold">
                  <SelectValue placeholder={t('priceTypeLabel')} />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>{t(`priceType${pt}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="service-price" className="text-slate-500">{t('priceLabel')}</Label>
              <Input
                id="service-price"
                type="number"
                min="0.01"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="p-3 rounded-xl font-semibold"
              />
              {priceSuggestion?.suggestedMedian && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setForm((f) => ({ ...f, price: priceSuggestion.suggestedMedian as string }))}
                  className="h-auto p-0 justify-start text-[10px] text-blue-600 dark:text-sky-400 font-bold text-left whitespace-normal"
                >
                  {t('pricingSuggestionHint', {
                    min: priceSuggestion.suggestedMin ?? '—',
                    max: priceSuggestion.suggestedMax ?? '—',
                  })}
                </Button>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="service-duration" className="text-slate-500">{t('durationLabel')}</Label>
              <Input
                id="service-duration"
                type="number"
                min="15"
                step="15"
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                className="p-3 rounded-xl font-semibold"
              />
              {durationHint && <span className="text-[10px] text-slate-400 font-bold">{durationHint}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="brand"
              onClick={handleSave}
              disabled={saving}
              className="h-auto px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 text-xs shadow-md"
            >
              {saving ? t('saving') : t('save')}
            </Button>
            <Button
              variant="secondary"
              onClick={resetForm}
              className="h-auto px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold"
            >
              {t('cancel')}
            </Button>
          </div>
        </Card>
      )}

      {/* Services list */}
      <Card className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Icon name="sparkles" size={16} className="text-amber-500" />
          {t('myServicesTitle', { count: services.length })}
        </h3>
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        )}
        {!loading && services.length === 0 && (
          <EmptyState
            variant="inline"
            icon="briefcase"
            title={t('noServices')}
            description={t('noServicesDesc')}
          />
        )}
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${(s.isActive ?? true) ? 'hover:border-amber-300 dark:hover:border-amber-800' : 'opacity-60'}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="hidden sm:flex w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white items-center justify-center shadow-md">
                  <Icon name="wrench" size={18} />
                </div>
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
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">{s.price} {s.currency}</span>
                <Button
                  variant="ghost"
                  onClick={() => handleToggleActive(s)}
                  className={cn(
                    'h-auto px-3 py-1.5 rounded-xl text-[10px] font-extrabold',
                    (s.isActive ?? true)
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
                  )}
                >
                  {(s.isActive ?? true) ? t('active') : t('inactive')}
                </Button>
                <Button variant="ghost" onClick={() => startEdit(s)} className="h-auto p-1 text-xs text-slate-400 hover:text-amber-600 hover:bg-transparent font-bold">
                  {t('edit')}
                </Button>
                <Button variant="ghost" onClick={() => handleRemove(s)} className="h-auto p-1 text-xs text-slate-400 hover:text-red-500 hover:bg-transparent font-bold">
                  {t('delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
    </>
  );
}
