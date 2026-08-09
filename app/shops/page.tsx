'use client';

import React, { useEffect, useState } from 'react';
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

export default function ShopsPage() {
  const t = useTranslations('shops');
  const [shops, setShops] = useState<MarketplaceShop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    marketplaceShopsApi.list().then(setShops).catch(() => setShops([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
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
            <p className="text-xs text-slate-400 font-semibold mt-1">{t('subtitle')}</p>
          </div>
        </div>
        <Link
          href="/marketplace"
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
        >
          <Icon name="shoppingbag" size={16} />
          {t('browseShop')}
        </Link>
      </div>

      {loading ? (
        <div className="h-[520px] w-full rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
      ) : (
        <ShopMap shops={shops} />
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
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{shop.name}</h3>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{shop.cityName}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{shop.address}</p>
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
