'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cartApi, wishlistApi } from '@/lib/api/endpoints';
import type { Product } from '@/lib/api/types';
import { useMoney } from '@/lib/money';

import { ProductCard } from '@/components/marketplace/ProductCard';
import { RecommendedProducts } from '@/components/marketplace/RecommendedProducts';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function WishlistPage() {
  const t = useTranslations('marketplace');
  const { money } = useMoney();
  useRequireAuth(['CLIENT']);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    wishlistApi.list().then(setProducts).catch(() => setProducts([])).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the wishlist on mount
  useEffect(load, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleRemove = async (product: Product) => {
    setBusyId(product.id);
    try {
      await wishlistApi.remove(product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setBusyId(product.id);
    try {
      await cartApi.addItem(product.id, 1);
      showToast(t('addedToCart'));
    } catch {
      showToast(t('addToCartFailed'));
    } finally {
      setBusyId(null);
    }
  };

  /** One tap to move the whole list into the cart — the reason a wishlist exists. */
  const handleAddAll = async () => {
    const available = products.filter((p) => p.isActive);
    if (available.length === 0) return;
    setAddingAll(true);
    try {
      await Promise.all(available.map((p) => cartApi.addItem(p.id, 1)));
      showToast(t('addedToCart'));
    } catch {
      showToast(t('addToCartFailed'));
    } finally {
      setAddingAll(false);
    }
  };

  const totalValue = useMemo(
    () => products.reduce((sum, p) => sum + Number(p.price || 0), 0),
    [products]
  );

  /** The category the reader has saved the most of, used to aim the recommendations. */
  const dominantCategoryId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
    let best: string | null = null;
    let bestCount = 0;
    for (const [id, n] of counts) {
      if (n > bestCount) {
        best = id;
        bestCount = n;
      }
    }
    return best;
  }, [products]);

  return (
    <>
      <ClientPageHeader icon="heart" eyebrow={t('badge')} title={t('wishlist')} />

      <div className="page-shell space-y-14 py-6 sm:py-12">

        {loading && (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <Skeleton className="aspect-square w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-2.5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="mt-2 h-9 w-full rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && products.length === 0 && (
          <EmptyState
            icon="heart"
            tone="emerald"
            title={t('noWishlist')}
            description={t('wishlistEmptyDesc')}
            actionLabel={t('backToShop')}
            actionHref="/marketplace"
          />
        )}

        {!loading && products.length > 0 && (
          <section className="space-y-5">
            {/* Summary rail: what is saved, what it comes to, and the one bulk action. */}
            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/25">
                  <Heart size={22} className="fill-white" />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                    {t('resultsCount', { count: products.length })}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {money(totalValue)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/marketplace"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-400"
                >
                  <ArrowLeft size={14} />
                  {t('backToShop')}
                </Link>
                <Button
                  size="raw"
                  variant="ghost"
                  onClick={handleAddAll}
                  disabled={addingAll}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
                >
                  <ShoppingCart size={14} />
                  {addingAll ? '…' : t('addAllToCart')}
                </Button>
              </div>
            </div>

            <FilterContainer className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((product, idx) => (
                <FilterItem key={product.id} index={idx % 4} className="h-full">
                  {/* `liked` is always true here and the heart un-saves — this list is
                      the wishlist, so the toggle only ever runs one direction. */}
                  <ProductCard
                    product={product}
                    liked
                    onToggleWishlist={handleRemove}
                    onAddToCart={handleAddToCart}
                    busy={busyId === product.id}
                    addToCartLabel={t('addToCart')}
                    wishlistLabel={t('wishlist')}
                  />
                </FilterItem>
              ))}
            </FilterContainer>
          </section>
        )}

        {!loading && (
          <RecommendedProducts
            excludeIds={products.map((p) => p.id)}
            categoryId={dominantCategoryId}
            onAdded={showToast}
          />
        )}
      </div>

      {toast && (
        <div className="animate-fade-in fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-1/2 z-50 -translate-x-1/2 lg:bottom-6 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-2xl dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </>
  );
}
