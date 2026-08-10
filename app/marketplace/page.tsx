'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, productCategoriesApi, productsApi, wishlistApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Product, ProductCategory } from '@/lib/api/types';
import { FilterButton, FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';

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

  return (
    <div className="page-shell py-12 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white items-center justify-center shadow-lg shadow-emerald-900/20">
            <Icon name="shoppingbag" size={22} />
          </div>
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t('badge')}
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">{t('title')}</h1>
            <p className="text-xs text-slate-400 font-semibold mt-1">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/shops"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Icon name="mappin" size={14} />
            {t('findShops')}
          </Link>
          {isClient && (
            <>
              <Link
                href="/wishlist"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <Icon name="heart" size={14} />
                {t('wishlist')}
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition"
              >
                <Icon name="shoppingcart" size={14} />
                {t('cart')}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Search + category chips */}
      <div className="space-y-4">
        <div className="relative">
          <Icon name="search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition"
          />
        </div>
        <FilterContainer className="flex flex-wrap gap-2">
          <FilterButton
            onClick={() => setCategoryId('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              categoryId === '' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {t('allCategories')}
          </FilterButton>
          {categories.map((c, idx) => (
            <FilterButton
              key={c.id}
              index={idx + 1}
              onClick={() => setCategoryId(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                categoryId === c.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.name}
            </FilterButton>
          ))}
        </FilterContainer>
      </div>

      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('resultsCount', { count: total })}</p>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('noProducts')}</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <FilterContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, idx) => {
            const liked = wishlistIds.has(product.id);
            return (
              <FilterItem key={product.id} index={idx % 4}>
                <div className="group glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col hover:shadow-xl hover:shadow-emerald-500/10 hover:border-emerald-200 dark:hover:border-emerald-900 transition-[box-shadow,border-color] duration-300">
                  <Link href={`/marketplace/${product.id}`} className="relative aspect-square block overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {product.imageUrls[0] ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                        <Icon name="package" size={32} />
                      </div>
                    )}
                    {product.discountPercent != null && (
                      <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-extrabold">
                        -{product.discountPercent}%
                      </span>
                    )}
                    {isClient && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleWishlist(product);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow"
                      >
                        <Icon
                          name="heart"
                          size={15}
                          className={liked ? 'fill-red-500 text-red-500' : 'text-slate-400'}
                        />
                      </button>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                      {product.categoryName}
                    </p>
                    <Link href={`/marketplace/${product.id}`} className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 flex-1">
                      {product.name}
                    </Link>
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {product.price} {product.currency}
                      </span>
                      {product.oldPrice && (
                        <span className="text-xs text-slate-400 line-through">{product.oldPrice}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={busyId === product.id}
                      className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-emerald-600 dark:hover:bg-emerald-400 disabled:opacity-50 transition"
                    >
                      <Icon name="shoppingcart" size={13} />
                      {busyId === product.id ? '...' : t('addToCart')}
                    </button>
                  </div>
                </div>
              </FilterItem>
            );
          })}
        </FilterContainer>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
          >
            {t('prev')}
          </button>
          <span className="text-xs font-bold text-slate-500">{t('pageOf', { page, total: totalPages })}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
          >
            {t('next')}
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
