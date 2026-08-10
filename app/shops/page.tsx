'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { marketplaceShopsApi } from '@/lib/api/endpoints';
import type { MarketplaceShop } from '@/lib/api/types';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

const ShopMap = dynamic(() => import('@/components/marketplace/ShopMap'), {
  ssr: false,
  loading: () => <div className="h-[520px] w-full rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />,
});

type Origin = { lat: number; lng: number };

export default function ShopsPage() {
  const t = useTranslations('shops');
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);

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

  return (
    <div className="page-shell py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white items-center justify-center shadow-lg shadow-emerald-900/20">
            <Icon name="store" size={22} />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t('badge')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">{t('title')}</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              {origin ? t('nearYouSubtitle', { count: shops.length }) : t('subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleNearMe}
            disabled={locating}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold disabled:opacity-60 transition"
          >
            <Icon name="navigation" size={16} className={locating ? 'animate-pulse' : ''} />
            {locating ? t('locating') : t('nearMe')}
          </button>
          <Link
            href="/marketplace"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
          >
            <Icon name="shoppingbag" size={16} />
            {t('browseShop')}
          </Link>
        </div>
      </div>

      {geoDenied && (
        <div className="px-5 py-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs font-semibold text-amber-700 dark:text-amber-400">
          {t('geoDenied')}
        </div>
      )}

      {loading ? (
        <div className="h-[520px] w-full rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
      ) : (
        <ShopMap shops={shops} origin={origin} />
      )}

      {!loading && shops.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('noShops')}</p>
        </div>
      )}

      {!loading && shops.length > 0 && (
        <FilterContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shops.map((shop, idx) => (
            <FilterItem key={shop.id} index={idx % 3}>
              <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-3 h-full hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-900 transition-[box-shadow,border-color] duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Icon name="store" size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{shop.name}</h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{shop.cityName}</p>
                  </div>
                  {shop.distanceKm != null && (
                    <span className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold">
                      {t('kmAway', { km: shop.distanceKm })}
                    </span>
                  )}
                </div>
                {shop.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{shop.description}</p>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400">{shop.address}</p>
                {shop.workingHours && (
                  <p className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    <Icon name="clock" size={12} />
                    {shop.workingHours}
                  </p>
                )}
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Icon name="user" size={12} />
                    {shop.phone}
                  </a>
                )}
              </div>
            </FilterItem>
          ))}
        </FilterContainer>
      )}
    </div>
  );
}
