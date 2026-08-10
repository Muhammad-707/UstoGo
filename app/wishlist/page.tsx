'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cartApi, wishlistApi } from '@/lib/api/endpoints';
import type { Product } from '@/lib/api/types';
import { FilterContainer, FilterItem } from '@/components/ui/FilterAnimate';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export default function WishlistPage() {
  const t = useTranslations('marketplace');
  useRequireAuth(['CLIENT']);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
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

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    try {
      await wishlistApi.remove(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (productId: string) => {
    setBusyId(productId);
    try {
      await cartApi.addItem(productId, 1);
      showToast(t('addedToCart'));
    } catch {
      showToast(t('addToCartFailed'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
    <ClientPageHeader icon="heart" eyebrow={t('badge')} title={t('wishlist')} />
    <div className="page-shell py-12 space-y-8">

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-64 rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
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
        <FilterContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, idx) => (
            <FilterItem key={product.id} index={idx % 4}>
              <div className="glass-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden h-full flex flex-col">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                  <Link href={`/marketplace/${product.id}`}>
                    {product.imageUrls[0] ? (
                      <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Icon name="package" size={28} />
                      </div>
                    )}
                  </Link>
                  <button
                    onClick={() => handleRemove(product.id)}
                    disabled={busyId === product.id}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur flex items-center justify-center shadow"
                  >
                    <Icon name="heart" size={15} className="fill-red-500 text-red-500" />
                  </button>
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <Link href={`/marketplace/${product.id}`} className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 flex-1">
                    {product.name}
                  </Link>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-slate-900 dark:text-white">
                      {product.price} {product.currency}
                    </span>
                    {product.oldPrice && <span className="text-xs text-slate-400 line-through">{product.oldPrice}</span>}
                  </div>
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={busyId === product.id || !product.isActive}
                    className="mt-1 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-emerald-600 dark:hover:bg-emerald-400 disabled:opacity-50 transition"
                  >
                    <Icon name="shoppingcart" size={13} />
                    {t('addToCart')}
                  </button>
                </div>
              </div>
            </FilterItem>
          ))}
        </FilterContainer>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
    </>
  );
}
