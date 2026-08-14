'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { cartApi, productsApi, wishlistApi } from '@/lib/api/endpoints';
import type { Product } from '@/lib/api/types';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { ProductCard } from '@/components/marketplace/ProductCard';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { Skeleton } from '@/components/ui/skeleton';

export interface RecommendedProductsProps {
  /** Products already in the cart / on the wishlist — never recommend those back. */
  excludeIds?: string[];
  /** Narrow the pool to a category the reader has already shown interest in. */
  categoryId?: string | null;
  count?: number;
  className?: string;
  onAdded?: (message: string) => void;
}

/**
 * "Recommended for you" under the cart and the wishlist.
 *
 * There is no recommendation endpoint, so the ranking is done here and deliberately
 * simple: pull a page of live products (from the reader's own category when we know
 * one), drop anything they already have, and put the discounted items first. A rail of
 * things already in the cart would be worse than no rail, which is why `excludeIds`
 * is applied before the slice rather than after.
 */
export function RecommendedProducts({
  excludeIds = [],
  categoryId,
  count = 4,
  className,
  onAdded,
}: RecommendedProductsProps) {
  const t = useTranslations('marketplace');
  const router = useRouter();
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [pool, setPool] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading before refetching on category change
    setLoading(true);
    productsApi
      .list({ page: 1, limit: 24, categoryId: categoryId || undefined })
      .then((res) => {
        if (cancelled) return;
        // A category with almost nothing in it would render a one-card rail, so fall
        // back to the whole catalogue rather than showing a thin one.
        if (categoryId && res.items.length < count + excludeIds.length) {
          return productsApi.list({ page: 1, limit: 24 }).then((all) => {
            if (!cancelled) setPool(all.items);
          });
        }
        setPool(res.items);
      })
      .catch(() => {
        if (!cancelled) setPool([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  useEffect(() => {
    if (!isClient) return;
    wishlistApi
      .list()
      .then((items) => setWishlistIds(new Set(items.map((p) => p.id))))
      .catch(() => {});
  }, [isClient]);

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);

  const picks = useMemo(() => {
    return pool
      .filter((p) => p.isActive && !excluded.has(p.id))
      .sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0))
      .slice(0, count);
  }, [pool, excluded, count]);

  const handleAddToCart = async (product: Product) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!isClient) return;
    setBusyId(product.id);
    try {
      await cartApi.addItem(product.id, 1);
      onAdded?.(t('addedToCart'));
    } catch {
      onAdded?.(t('addToCartFailed'));
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

  // Nothing to suggest is not an error state — the section simply does not exist.
  if (!loading && picks.length === 0) return null;

  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            <Sparkles size={13} />
            {t('recommendedBadge')}
          </span>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('recommended')}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('recommendedSub')}</p>
        </div>
        <Link
          href="/marketplace"
          className="flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 transition hover:gap-2 dark:text-emerald-400"
        >
          {t('backToShop')}
          <ArrowRight size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
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
      ) : (
        <FilterContainer className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {picks.map((product) => (
            <FilterItem key={product.id} className="h-full">
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
    </section>
  );
}

export default RecommendedProducts;
