'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { mastersApi, citiesApi } from '@/lib/api/endpoints';
import { flattenCategories, resolveCategoryId } from '@/lib/api/category-utils';
import type { Category, City, MasterPublic } from '@/lib/api/types';
import { getAvatarUrl, getCoverUrl } from '@/lib/placeholders';
import { FavoriteButton } from '@/components/masters/FavoriteButton';
import { FilterContainer, FilterItem, FilterButton, AnimatedGrid, AnimatedCard } from '@/components/ui/FilterAnimate';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

/** Radix has no empty-string option, so "any" travels as this sentinel. */
const ANY = '__any';

const SearchMap = dynamic(() => import('@/components/search/SearchMap'), {
  ssr: false,
  loading: () => (
    <Skeleton className="h-[520px] w-full rounded-3xl" />
  ),
});

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
  const [viewMode, setViewModeState] = useState<'grid' | 'list' | 'map'>('grid');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    citiesApi.list().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('search:viewMode');
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrates view mode from localStorage (unavailable during SSR)
    if (stored === 'grid' || stored === 'list' || stored === 'map') setViewModeState(stored);
  }, []);

  const setViewMode = (mode: 'grid' | 'list' | 'map') => {
    setViewModeState(mode);
    localStorage.setItem('search:viewMode', mode);
  };

  const handleFindNearMe = () => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    setLocating(true);
    setLocationError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocationError(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const filterKey = `${selectedCategory}|${verifiedOnly}|${minRating}|${maxPrice}|${searchQuery}|${selectedCity}|${sortBy}|${viewMode}|${userLocation ? `${userLocation.lat},${userLocation.lng},${radiusKm}` : ''}`;

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets pagination when any filter changes
    setPage(1);
  }, [searchQuery, selectedCategory, verifiedOnly, minRating, maxPrice, selectedCity, sortBy, userLocation, radiusKm]);

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
          sort: sortBy || (userLocation ? 'distance:asc' : undefined),
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radiusKm: userLocation ? radiusKm : undefined,
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
  }, [searchQuery, selectedCategory, verifiedOnly, minRating, maxPrice, selectedCity, sortBy, page, userLocation, radiusKm]);

  const cityName = cities.find((c) => c.id === selectedCity)?.name;
  const categoryName = flatCategories.find((c) => c.id === selectedCategory)?.name;

  /** Every filter currently narrowing the list, as one removable chip each. Buried in a
      sidebar, an active filter is the commonest reason a search "returns nothing" and
      the reader cannot see why. */
  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...(searchQuery ? [{ key: 'q', label: `"${searchQuery}"`, clear: () => setSearchQuery('') }] : []),
    ...(categoryName && selectedCategory !== 'all'
      ? [{ key: 'cat', label: categoryName, clear: () => setSelectedCategory('all') }]
      : []),
    ...(cityName ? [{ key: 'city', label: cityName, clear: () => setSelectedCity('') }] : []),
    ...(verifiedOnly ? [{ key: 'ver', label: t('verifiedOnly'), clear: () => setVerifiedOnly(false) }] : []),
    ...(minRating > 0 ? [{ key: 'rate', label: `★ ${minRating}+`, clear: () => setMinRating(0) }] : []),
    ...(maxPrice !== 500
      ? [{ key: 'price', label: t('perHour', { price: maxPrice }), clear: () => setMaxPrice(500) }]
      : []),
    ...(userLocation
      ? [{ key: 'loc', label: t('radiusValue', { km: radiusKm }), clear: () => setUserLocation(null) }]
      : []),
  ];

  const resetAll = () => {
    setSelectedCategory('all');
    setVerifiedOnly(false);
    setMinRating(0);
    setMaxPrice(500);
    setSearchQuery('');
    setSelectedCity('');
    setSortBy('');
  };

  return (
    <div className="pb-24">

      {/* HERO — the search field is the page, so it gets the top of it rather than
          sitting under a heading as one more control. */}
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-48 right-1/4 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="page-shell relative space-y-5 py-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
              <Icon name="Search" size={13} />
              {t('eyebrow')}
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl xl:text-5xl dark:text-white">
              {t('title')}
            </h1>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{t('subtitle')}</p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-3xl">
            <Icon name="Search" size={20} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-12 text-sm font-medium text-slate-900 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] transition placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            {searchQuery && (
              <Button
                size="raw"
                variant="ghost"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <Icon name="X" size={14} />
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('activeFilters')}
              </span>
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.clear}
                  className="group inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-sky-300"
                >
                  {chip.label}
                  <Icon name="X" size={12} className="opacity-60 transition group-hover:opacity-100" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetAll}
                className="text-[11px] font-bold text-slate-500 underline-offset-2 transition hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
              >
                {t('resetAll')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Layout Grid (Filter Sidebar + Master Cards Result Grid) */}
      <div className="page-shell grid grid-cols-1 gap-8 py-10 lg:grid-cols-4">

        {/* Filter Sidebar */}
        <FilterContainer className="h-fit space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-[88px] dark:border-slate-800 dark:bg-slate-900">
          <FilterItem className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Icon name="Filter" size={18} className="text-blue-600 dark:text-sky-400" />
              {t('filters')}
            </h3>
            <Button size="raw" variant="ghost" onClick={resetAll} className="text-xs text-blue-600 font-bold hover:underline">
              {t('resetAll')}
            </Button>
          </FilterItem>

          {/* Category Selector */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('category')}</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full p-3 rounded-xl text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCategories', { count: flatCategories.length })}</SelectItem>
                {flatCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>

          {/* City Selector */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('city')}</label>
            <Select
              value={selectedCity || ANY}
              onValueChange={(value) => setSelectedCity(value === ANY ? '' : value)}
            >
              <SelectTrigger className="w-full p-3 rounded-xl text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t('allCities')}</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FilterItem>

          {/* Near Me */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('nearMe')}</label>
            {userLocation ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <Icon name="MapPin" size={13} />
                    {t('nearMeActive')}
                  </span>
                  <Button size="raw" variant="ghost" onClick={() => setUserLocation(null)} className="text-slate-400 hover:text-red-500">
                    <Icon name="X" size={13} />
                  </Button>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>{t('radiusLabel')}</span>
                  <span className="text-slate-900 dark:text-white">{t('radiusValue', { km: radiusKm })}</span>
                </div>
                <Slider
                  min={5}
                  max={200}
                  step={5}
                  value={[radiusKm]}
                  onValueChange={([value]) => setRadiusKm(value)}
                  aria-label={t('radiusLabel')}
                  className="w-full cursor-pointer"
                />
              </div>
            ) : (
              <Button size="raw" variant="ghost"
                onClick={handleFindNearMe}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-blue-500 transition disabled:opacity-60"
              >
                <Icon name="MapPin" size={14} />
                {locating ? t('locating') : t('nearMe')}
              </Button>
            )}
            {locationError && <p className="text-[10px] font-bold text-red-500">{t('locationError')}</p>}
          </FilterItem>

          {/* Sort */}
          <FilterItem className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('sortBy')}</label>
            <Select value={sortBy || ANY} onValueChange={(value) => setSortBy(value === ANY ? '' : value)}>
              <SelectTrigger className="w-full p-3 rounded-xl text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t('sortDefault')}</SelectItem>
                <SelectItem value="rating:desc">{t('sortRating')}</SelectItem>
                <SelectItem value="price:asc">{t('sortPriceAsc')}</SelectItem>
                <SelectItem value="price:desc">{t('sortPriceDesc')}</SelectItem>
                <SelectItem value="createdAt:desc">{t('sortNewest')}</SelectItem>
                {userLocation && <SelectItem value="distance:asc">{t('sortDistance')}</SelectItem>}
              </SelectContent>
            </Select>
          </FilterItem>

          {/* Verified Toggle */}
          <FilterItem className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('verifiedOnly')}</span>
            <Checkbox checked={verifiedOnly} onCheckedChange={(checked) => setVerifiedOnly(checked === true)} className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer size-4" />
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
            <Slider
              min={20}
              max={500}
              step={10}
              value={[maxPrice]}
              onValueChange={([value]) => setMaxPrice(value)}
              aria-label={t('maxRate')}
              className="w-full cursor-pointer"
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
              <FilterButton
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-lg transition ${
                  viewMode === 'map'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title={t('mapView')}
              >
                <Icon name="MapPin" size={18} />
              </FilterButton>
            </div>
          </FilterContainer>

          {viewMode === 'map' && !error && (
            <SearchMap masters={masters} userLocation={userLocation} />
          )}

          {viewMode !== 'map' && loading && page === 1 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                >
                  <Skeleton className="h-24 w-full rounded-none" />
                  <div className="space-y-3 p-6 pt-0">
                    <Skeleton className="-mt-9 h-16 w-16 rounded-2xl" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && error && (
            <EmptyState icon="AlertTriangle" tone="amber" title={t('loadErrorTitle')} description={t('loadErrorDesc')} />
          )}

          {/* Master Cards Grid / List */}
          {viewMode !== 'map' && (!error && !(loading && page === 1) && masters.length === 0 ? (
            <EmptyState icon="Search" title={t('noResultsTitle')} description={t('noResultsDesc')} />
          ) : !error && viewMode === 'grid' ? (
            <AnimatedGrid animKey={filterKey} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {masters.map((m, idx) => (
                <AnimatedCard key={m.id} index={idx % 3} className="h-full">
                  <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_24px_48px_-24px_rgba(37,99,235,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900">

                    {/* Cover — the same shape the feed and the profile use, so a master
                        looks like the same master in all three places. */}
                    <div className="relative h-24 overflow-hidden">
                      <img
                        src={m.bannerUrl || getCoverUrl(m.id)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                      <span className="absolute right-3 top-3">
                        <FavoriteButton masterId={m.id} size="sm" />
                      </span>
                      {m.distanceKm != null && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                          {t('distanceAway', { km: Math.round(m.distanceKm) })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-6 pt-0">
                      <div className="relative -mt-9 mb-3 w-fit">
                        <img
                          src={m.avatarUrl ?? getAvatarUrl(m.id, m.displayName)}
                          alt={m.displayName}
                          className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-lg dark:border-slate-900"
                        />
                        {m.hasCertificates && (
                          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                            <Icon name="ShieldCheck" size={13} />
                          </span>
                        )}
                      </div>

                      <h3 className="truncate text-base font-extrabold text-slate-900 dark:text-white">
                        {m.displayName}
                      </h3>
                      <p className="mt-0.5 truncate text-xs font-semibold text-blue-600 dark:text-sky-400">
                        {m.categories.join(', ') || '—'}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 font-bold text-amber-500">
                          <Icon name="Star" size={13} className="fill-amber-400" />
                          {m.ratingAverage}
                          <span className="font-medium text-slate-400">({m.ratingCount})</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Icon name="MapPin" size={12} />
                          {m.cityName}
                        </span>
                      </div>

                      {m.bio && (
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          {m.bio}
                        </p>
                      )}

                      <div className="mt-auto space-y-3 pt-4">
                        <div className="flex items-baseline justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {t('rate')}
                          </span>
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {m.priceFrom ? t('perHour', { price: m.priceFrom }) : '—'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href={`/master/${m.id}`}
                            className="rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                          >
                            {t('profile')}
                          </Link>
                          <Link
                            href={`/booking?master=${m.id}`}
                            className="btn-ripple rounded-xl bg-blue-600 py-2.5 text-center text-xs font-bold text-white shadow transition hover:bg-blue-700"
                          >
                            {t('bookNow')}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatedGrid>
          ) : !error ? (
            <AnimatedGrid animKey={filterKey} className="space-y-4">
              {masters.map((m, idx) => (
                <Card key={m.id} asChild>
                  <AnimatedCard index={idx} className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl hover:border-blue-200 dark:hover:border-sky-900 transition-[box-shadow,border-color] duration-300">
                    <div className="flex items-center gap-6">
                      <img src={m.avatarUrl ?? getAvatarUrl(m.id, m.displayName)} alt={m.displayName} className="w-20 h-20 rounded-2xl object-cover shadow-md" />
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

                      <div className="flex items-center gap-2">
                        <FavoriteButton masterId={m.id} />
                        <Link
                          href={`/booking?master=${m.id}`}
                          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow transition btn-ripple"
                        >
                          {t('bookNow')}
                        </Link>
                      </div>
                    </div>
                  </AnimatedCard>
                </Card>
              ))}
            </AnimatedGrid>
          ) : null)}

          {viewMode !== 'map' && !error && page < totalPages && (
            <div className="text-center pt-2">
              <Button size="raw" variant="ghost"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200 hover:border-blue-500 transition shadow-sm disabled:opacity-50"
              >
                {loading ? t('loadingMore') : t('loadMore')}
              </Button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
