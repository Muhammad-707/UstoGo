'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, citiesApi } from '@/lib/api/endpoints';
import { flattenCategories, resolveCategoryId } from '@/lib/api/category-utils';
import type { Category, City, MasterPublic } from '@/lib/api/types';
import { getAvatarUrl } from '@/lib/placeholders';
import { FilterContainer, FilterItem, FilterButton, AnimatedGrid, AnimatedCard } from '@/components/ui/FilterAnimate';

export default function SearchClient({
  categories,
  initialMasters,
  initialTotalPages,
  initialTotal,
  initialCategory,
}: {
  categories: Category[];
  initialMasters: MasterPublic[];
  initialTotalPages: number;
  initialTotal: number;
  initialCategory: string;
}) {
  const t = useTranslations('search');

  const flatCategories = useMemo(() => flattenCategories(categories), [categories]);
  const initialResolvedCategory = useMemo(
    () => resolveCategoryId(initialCategory, categories) ?? 'all',
    [initialCategory, categories]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialResolvedCategory);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [cities, setCities] = useState<City[]>([]);
  const [viewMode, setViewModeState] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('search:viewMode');
    if (stored === 'grid' || stored === 'list') setViewModeState(stored);
  }, []);

  const setViewMode = (mode: 'grid' | 'list') => {
    setViewModeState(mode);
    localStorage.setItem('search:viewMode', mode);
  };

  const filterKey = `${selectedCategory}|${verifiedOnly}|${minRating}|${maxPrice}|${searchQuery}|${selectedCity}|${sortBy}|${viewMode}`;

  const [masters, setMasters] = useState<MasterPublic[]>(initialMasters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Initial data comes from the server; skip the very first fetch run.
  const firstRun = useRef(true);

  // Reset pagination whenever a filter (other than page itself) changes.
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory, verifiedOnly, minRating, maxPrice, selectedCity, sortBy]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      setLoading(true);
      setError(false);
      mastersApi
        .search({
          search: searchQuery || undefined,
          categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
          cityId: selectedCity || undefined,
          minRating: minRating || undefined,
          maxPrice: maxPrice || undefined,
          hasCertificates: verifiedOnly || undefined,
          sort: sortBy || undefined,
          page,
          limit: 20,
        })
        .then((res) => {
          setMasters((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
          setTotalPages(res.meta.totalPages);
          setTotal(res.meta.total);
        })
    .catch(() => setError(true))
    .finally(() => setLoading(false));
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchQuery, selectedCategory, verifiedOnly, minRating, maxPrice, selectedCity, sortBy, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header & Main Search */}
      <div className="space-y-4">
        <span className="text-xs font-extrabold uppercase tracking-widest text-blue-600 dark:text-sky-400">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('title')}
        </h1>

        {/* Search Bar */}
        <div className="relative max-w-3xl">
          <Icon name="Search" size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-md transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <Icon name="X" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Layout Grid (Filter Sidebar + Master Cards Result Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Filter Sidebar */}
        <FilterContainer className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 h-fit shadow-sm">
          <FilterItem className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Icon name="Filter" size={18} className="text-blue-600 dark:text-sky-400" />
              {t('filters')}
            </h3>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setVerifiedOnly(false);
                setMinRating(0);
                setMaxPrice(500);
                setSearchQuery('');
                setSelectedCity('');
                setSortBy('');
              }}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              {t('resetAll')}
            </button>
          </FilterItem>

          {/* Category Selector */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('category')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition"
            >
              <option value="all">{t('allCategories', { count: flatCategories.length })}</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FilterItem>

          {/* City Selector */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('city')}</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition"
            >
              <option value="">{t('allCities')}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FilterItem>

          {/* Sort */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('sortBy')}</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none transition"
            >
              <option value="">{t('sortDefault')}</option>
              <option value="rating:desc">{t('sortRating')}</option>
              <option value="price:asc">{t('sortPriceAsc')}</option>
              <option value="price:desc">{t('sortPriceDesc')}</option>
              <option value="createdAt:desc">{t('sortNewest')}</option>
            </select>
          </FilterItem>

          {/* Verified Toggle */}
          <FilterItem className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('verifiedOnly')}</span>
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
            />
          </FilterItem>

          {/* Rating Filter */}
          <FilterItem className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('minRating')}</label>
            <div className="flex gap-2">
              {[4.0, 4.5, 4.8].map((rating, idx) => (
                <FilterButton
                  key={rating}
                  index={idx}
                  onClick={() => setMinRating((prev) => (prev === rating ? 0 : rating))}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon name="Star" size={12} className="fill-amber-400 text-amber-400" />
                  {rating}+
                </FilterButton>
              ))}
            </div>
          </FilterItem>

          {/* Max Hourly Rate Slider */}
          <FilterItem className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-400 uppercase tracking-wider">{t('maxRate')}</span>
              <span className="text-slate-900 dark:text-white">{t('perHour', { price: maxPrice })}</span>
            </div>
            <input
              type="range"
              min="20"
              max="500"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </FilterItem>
        </FilterContainer>

        {/* Result Area */}
        <div className="lg:col-span-3 space-y-6">

          {/* Top Bar (Results Count + View Mode Switcher) */}
          <FilterContainer className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <FilterItem>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {t.rich('showingResults', {
                  count: total,
                  highlight: (chunks) => <span className="text-blue-600 dark:text-sky-400 font-extrabold">{chunks}</span>,
                })}
              </p>
            </FilterItem>

            <div className="flex items-center gap-2">
              <FilterButton
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={t('gridView')}
              >
                <Icon name="Grid" size={18} />
              </FilterButton>
              <FilterButton
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={t('listView')}
              >
                <Icon name="Menu" size={18} />
              </FilterButton>
            </div>
          </FilterContainer>

          {loading && page === 1 && (
            <div className="glass-card rounded-3xl p-12 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Loading masters...
            </div>
          )}

          {!loading && error && (
            <div className="glass-card rounded-3xl p-12 text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
              Could not load masters. Please try again later.
            </div>
          )}

          {/* Master Cards Grid / List */}
          {!error && !(loading && page === 1) && masters.length === 0 ? (
            <div className="glass-card rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                <Icon name="Search" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('noResultsTitle')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {t('noResultsDesc')}
              </p>
            </div>
          ) : !error && viewMode === 'grid' ? (
            <AnimatedGrid animKey={filterKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masters.map((m, idx) => (
                <AnimatedCard key={m.id} index={idx % 3} className="glass-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between group">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <img src={m.avatarUrl ?? getAvatarUrl(m.id)} alt={m.displayName} className="w-16 h-16 rounded-2xl object-cover shadow-md" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">{m.displayName}</h3>
                          {m.hasCertificates && <Icon name="ShieldCheck" size={16} className="text-blue-500" />}
                        </div>
                        <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                          {m.categories.join(', ') || '—'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-1">
                          <Icon name="Star" size={14} className="fill-amber-400" />
                          <span>{m.ratingAverage} ({m.ratingCount})</span>
                        </div>
                      </div>
                    </div>

                    {m.bio && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {m.bio}
                      </p>
                    )}
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800/80 mt-4">
                    <div className="flex items-center justify-between py-3 text-xs">
                      <span className="text-slate-400 font-medium">{m.cityName}</span>
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {m.priceFrom ? t('perHour', { price: m.priceFrom }) : '—'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Link
                        href={`/master/${m.id}`}
                        className="py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {t('profile')}
                      </Link>
                      <Link
                        href={`/booking?master=${m.id}`}
                        className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-center text-xs font-bold shadow transition btn-ripple"
                      >
                        {t('bookNow')}
                      </Link>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatedGrid>
          ) : !error ? (
            <AnimatedGrid animKey={filterKey} className="space-y-4">
              {masters.map((m, idx) => (
                <AnimatedCard key={m.id} index={idx} className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <img src={m.avatarUrl ?? getAvatarUrl(m.id)} alt={m.displayName} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">{m.displayName}</h3>
                        {m.hasCertificates && <Icon name="ShieldCheck" size={18} className="text-blue-500" />}
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold">
                          {t('jobsDone', { count: m.completedBookingsCount })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                        {m.categories.join(', ') || '—'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Icon name="Star" size={14} className="fill-amber-400" />
                          {m.ratingAverage} ({t('reviewsCount', { count: m.ratingCount })})
                        </span>
                        <span>• {m.cityName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('rate')}</span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {m.priceFrom ? t('perHour', { price: m.priceFrom }) : '—'}
                      </span>
                    </div>

                    <Link
                      href={`/booking?master=${m.id}`}
                      className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                    >
                      {t('bookNow')}
                    </Link>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatedGrid>
          ) : null}

          {!error && page < totalPages && (
            <div className="text-center pt-2">
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
