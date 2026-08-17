'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Building2, Clock, MapPin, Navigation, Phone, ShoppingBag, Store } from 'lucide-react';

import { marketplaceShopsApi } from '@/lib/api/endpoints';
import type { MarketplaceShop } from '@/lib/api/types';
import { cn } from '@/lib/utils';

import { EmptyState } from '@/components/ui/EmptyState';
import { FilterButton, FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const ShopMap = dynamic(() => import('@/components/marketplace/ShopMap'), {
  ssr: false,
  loading: () => <Skeleton className="h-[380px] sm:h-[520px] w-full rounded-3xl" />,
});

type Origin = { lat: number; lng: number };

const ALL = '__all__';

export default function ShopsPage() {
  const t = useTranslations('shops');
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [city, setCity] = useState<string>(ALL);

  // Bare on first paint (the whole map), re-fetched with lat/lng once the user asks
  // for "near me" — the backend does the distance sort, so the list re-orders itself.
  const load = useCallback((at: Origin | null) => {
    setLoading(true);
    marketplaceShopsApi
      .list(at ? { lat: at.lat, lng: at.lng } : {})
      .then(setShops)
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the full pin set on mount
    load(null);
  }, [load]);

  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setGeoDenied(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const at = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(at);
        setGeoDenied(false);
        setLocating(false);
        load(at);
      },
      () => {
        setGeoDenied(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  // Cities come from the pins themselves — there is no city endpoint for shops, and a
  // filter offering a city with no branch in it would be a dead option.
  const cities = useMemo(() => {
    const seen = new Map<string, number>();
    for (const shop of shops) seen.set(shop.cityName, (seen.get(shop.cityName) ?? 0) + 1);
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [shops]);

  // The filter narrows the list *and* the map, so the pins never disagree with the cards
  // underneath them.
  const visible = useMemo(
    () => (city === ALL ? shops : shops.filter((shop) => shop.cityName === city)),
    [shops, city],
  );

  const nearest = origin ? visible.find((s) => s.distanceKm != null) : undefined;

  return (
    <div className="pb-24">
      {/* HERO — no photograph: the map below is the picture, and stacking artwork on
          top of it would push the one thing the reader came for below the fold. */}
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="page-shell relative flex flex-col justify-between gap-8 py-14 lg:flex-row lg:items-end">
          <div className="max-w-xl space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <Store size={13} />
              {t('badge')}
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl dark:text-white">
              {t('title')}
            </h1>
            <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {origin ? t('nearYouSubtitle', { count: visible.length }) : t('subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="raw"
                variant="ghost"
                onClick={handleNearMe}
                disabled={locating}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
              >
                <Navigation size={15} className={locating ? 'animate-pulse' : ''} />
                {locating ? t('locating') : t('nearMe')}
              </Button>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400"
              >
                <ShoppingBag size={15} />
                {t('browseShop')}
              </Link>
            </div>
          </div>

          {/* Two figures only, and the second one appears only once it is real — a
              "nearest branch" that reads 0 km before the reader has shared a location
              would be a number invented by the page. */}
          {!loading && shops.length > 0 && (
            <div className="flex shrink-0 divide-x divide-slate-200 dark:divide-slate-800">
              <div className="pr-6">
                <div className="flex items-baseline gap-1.5">
                  <Store size={15} className="shrink-0 translate-y-px text-emerald-600 dark:text-emerald-400" />
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {shops.length}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('statShops')}
                </p>
              </div>
              <div className="px-6">
                <div className="flex items-baseline gap-1.5">
                  <Building2 size={15} className="shrink-0 translate-y-px text-emerald-600 dark:text-emerald-400" />
                  <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                    {cities.length}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('statCities')}
                </p>
              </div>
              {nearest?.distanceKm != null && (
                <div className="pl-6">
                  <div className="flex items-baseline gap-1.5">
                    <Navigation size={15} className="shrink-0 translate-y-px text-emerald-600 dark:text-emerald-400" />
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {nearest.distanceKm}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {t('statNearest')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="page-shell space-y-6 py-10">
        {geoDenied && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30">
            <MapPin size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-semibold leading-relaxed text-amber-700 dark:text-amber-400">{t('geoDenied')}</p>
          </div>
        )}

        {loading ? <Skeleton className="h-[380px] sm:h-[520px] w-full rounded-3xl" /> : <ShopMap shops={visible} origin={origin} />}

        {/* City chips appear only when there is more than one city to choose between. */}
        {!loading && cities.length > 1 && (
          <FilterContainer className="flex flex-wrap gap-2">
            <FilterButton
              onClick={() => setCity(ALL)}
              className={cn(
                'rounded-xl border px-4 py-2 text-xs font-bold transition',
                city === ALL
                  ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
              )}
            >
              {t('allCities')} · {shops.length}
            </FilterButton>
            {cities.map(([name, count], idx) => (
              <FilterButton
                key={name}
                index={idx + 1}
                onClick={() => setCity(name)}
                className={cn(
                  'rounded-xl border px-4 py-2 text-xs font-bold transition',
                  city === name
                    ? 'border-transparent bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300',
                )}
              >
                {name} · {count}
              </FilterButton>
            ))}
          </FilterContainer>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-3xl" />
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="store"
            tone="emerald"
            title={t('noShops')}
            description={city === ALL ? t('noShopsDesc') : t('noShopsInCity', { city })}
            actionLabel={t('browseShop')}
            actionHref="/marketplace"
          />
        )}

        {!loading && visible.length > 0 && (
          <FilterContainer className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((shop, idx) => (
              <FilterItem key={shop.id} index={idx % 3}>
                <Card className="group flex h-full flex-col gap-3 rounded-3xl border border-slate-200 p-6 transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-slate-800 dark:hover:border-emerald-900">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/20">
                      <Store size={19} strokeWidth={2.2} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-extrabold text-slate-900 dark:text-white">{shop.name}</h3>
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {shop.cityName}
                      </p>
                    </div>
                    {shop.distanceKm != null && (
                      <span className="shrink-0 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold tabular-nums text-white">
                        {t('kmAway', { km: shop.distanceKm })}
                      </span>
                    )}
                  </div>

                  {shop.description && (
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{shop.description}</p>
                  )}

                  <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    {shop.address}
                  </p>

                  {shop.workingHours && (
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Clock size={12} className="shrink-0" />
                      {shop.workingHours}
                    </p>
                  )}

                  {/* Pushed to the bottom so cards of different text lengths still line
                      their actions up across the row. */}
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    {shop.phone && (
                      <a
                        href={`tel:${shop.phone}`}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-200 dark:hover:text-emerald-400"
                      >
                        <Phone size={13} />
                        {shop.phone}
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('openInMaps')}
                      title={t('openInMaps')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200',
                        shop.phone ? 'shrink-0' : 'flex-1',
                      )}
                    >
                      <Navigation size={13} />
                      {shop.phone ? '' : t('openInMaps')}
                    </a>
                  </div>
                </Card>
              </FilterItem>
            ))}
          </FilterContainer>
        )}
      </div>
    </div>
  );
}
