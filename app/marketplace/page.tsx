'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  BadgePercent,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { cartApi, productCategoriesApi, productsApi, wishlistApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Product, ProductCategory } from '@/lib/api/types';
import { cn } from '@/lib/utils';

import { ProductCard } from '@/components/marketplace/ProductCard';
import { FilterButton, FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/** Warehouse aisle — what a materials marketplace actually looks like behind the counter. */
const MARKET_HERO =
  'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1400&q=80';

function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const t = useTranslations('marketplace');
  const router = useRouter();
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    productCategoriesApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!isClient) return;
    wishlistApi.list().then((items) => setWishlistIds(new Set(items.map((p) => p.id)))).catch(() => {});
  }, [isClient]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before a debounced fetch
    setLoading(true);
    const handle = setTimeout(() => {
      productsApi
        .list({ page, limit: 12, categoryId: categoryId || undefined, search: search.trim() || undefined })
        .then((res) => {
          if (cancelled) return;
          setProducts(res.items);
          setTotalPages(res.meta.totalPages);
          setTotal(res.meta.total);
        })
        .catch(() => {
          if (!cancelled) setProducts([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [page, categoryId, search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets to page 1 when filters change
    setPage(1);
  }, [categoryId, search]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isClient) return;
    setBusyId(product.id);
    try {
      await cartApi.addItem(product.id, 1);
      showToast(t('addedToCart'));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('addToCartFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isClient) return;
    const liked = wishlistIds.has(product.id);
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (liked) next.delete(product.id);
      else next.add(product.id);
      return next;
    });
    try {
      if (liked) await wishlistApi.remove(product.id);
      else await wishlistApi.add(product.id);
    } catch {
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (liked) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    }
  };

  const filtersActive = categoryId !== '' || search.trim() !== '';
  const clearFilters = () => {
    setCategoryId('');
    setSearch('');
  };

  return (
    <div className="pb-24">

      {/* 1. HERO — artwork left, copy right. Mirrored against /categories on purpose:
             two catalogue pages that open with the identical split read as the same
             page twice, and the shop is the one where the goods should lead. */}
      <section className="relative isolate overflow-hidden border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />

        <div className="relative page-shell grid items-center gap-12 py-8 sm:py-16 lg:grid-cols-[1fr_1.05fr]">

          {/* Artwork */}
          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.45)]">
              <img src={MARKET_HERO} alt="" className="h-[440px] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -right-6 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/25">
                <Truck size={17} strokeWidth={2.3} />
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{t('heroNote')}</span>
            </div>
            <div className="absolute -left-5 top-8 flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                <BadgePercent size={17} strokeWidth={2.3} />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold text-slate-900 tabular-nums dark:text-white">{total}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('statProducts')}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
              <ShoppingBag size={13} />
              {t('badge')}
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl xl:text-6xl dark:text-white">
              {t('title')}
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {t('subtitle')}
            </p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search size={18} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                className="[&::-webkit-search-cancel-button]:appearance-none w-full rounded-2xl border border-slate-200 bg-white py-4 pl-14 pr-12 text-sm font-medium text-slate-900 shadow-[0_12px_32px_-16px_rgba(15,23,42,0.35)] outline-none transition placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-4 focus-visible:ring-emerald-500/15 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={t('clearFilters')}
                  className="absolute right-4 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Numbers */}
            <div className="flex max-w-lg divide-x divide-slate-200 dark:divide-slate-800">
              {[
                { value: `${total}`, label: t('statProducts'), Icon: Package },
                { value: `${categories.length}`, label: t('statCategories'), Icon: LayoutGrid },
              ].map((s, i) => (
                <div key={s.label} className={cn('flex-1', i === 0 ? 'pr-5' : 'px-5')}>
                  <div className="flex items-baseline gap-1.5">
                    <s.Icon size={15} className="shrink-0 translate-y-px text-emerald-600 dark:text-emerald-400" />
                    <span className="text-2xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {s.value}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold uppercase leading-snug tracking-wider text-slate-500 dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Shop / wishlist / cart */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/shops"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400"
              >
                <MapPin size={14} />
                {t('findShops')}
              </Link>
              {isClient && (
                <>
                  <Link
                    href="/wishlist"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-rose-400"
                  >
                    <Heart size={14} />
                    {t('wishlist')}
                  </Link>
                  <Link
                    href="/cart"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700"
                  >
                    <ShoppingCart size={14} />
                    {t('cart')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CATEGORY BAR — sticky under the 72px navbar */}
      <div className="sticky top-[72px] z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
        <div className="page-shell flex items-center justify-between gap-4 py-3">
          <FilterContainer className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar pb-0.5">
            <FilterButton
              onClick={() => setCategoryId('')}
              className={cn(
                'shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition',
                categoryId === ''
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
              )}
            >
              {t('allCategories')}
            </FilterButton>
            {categories.map((c, idx) => (
              <FilterButton
                key={c.id}
                index={idx + 1}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  'shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition',
                  categoryId === c.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-emerald-400'
                )}
              >
                {c.name}
              </FilterButton>
            ))}
          </FilterContainer>

          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('resultsCount', { count: total })}
            </span>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-900"
              >
                <X size={13} />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. PRODUCTS */}
      <section className="page-shell py-6 sm:py-12">
        {loading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <ProductCardSkeleton key={idx} />
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <EmptyState
            icon="package"
            title={t('noProducts')}
            description={t('noProductsDesc')}
            tone="emerald"
            actionLabel={filtersActive ? undefined : t('findShops')}
            actionHref={filtersActive ? undefined : '/shops'}
          />
        )}

        {!loading && products.length > 0 && (
          <FilterContainer className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product, idx) => (
              <FilterItem key={product.id} index={idx % 4} className="h-full">
                <ProductCard
                  product={product}
                  liked={wishlistIds.has(product.id)}
                  onToggleWishlist={isClient ? handleToggleWishlist : undefined}
                  onAddToCart={handleAddToCart}
                  busy={busyId === product.id}
                  addToCartLabel={t('addToCart')}
                  wishlistLabel={t('wishlist')}
                />
              </FilterItem>
            ))}
          </FilterContainer>
        )}

        {/* 4. PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <Button
              size="raw"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <ChevronLeft size={14} />
              {t('prev')}
            </Button>
            <span className="px-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              {t('pageOf', { page, total: totalPages })}
            </span>
            <Button
              size="raw"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              {t('next')}
              <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </section>

      {toast && (
        <div className="animate-fade-in fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 lg:bottom-6 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
}
