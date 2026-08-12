'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useAuth } from '@/contexts/AuthContext';
import { cartApi, productsApi, wishlistApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Product } from '@/lib/api/types';
import { useMoney } from '@/lib/money';
import { Button } from '@/components/ui/button';

export default function ProductDetailPage() {
  const t = useTranslations('marketplace');
  const { money } = useMoney();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets loading state before an async fetch
    setLoading(true);
    productsApi
      .byId(params.id)
      .then(setProduct)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    if (!isClient) return;
    wishlistApi.list().then((items) => setLiked(items.some((p) => p.id === params.id))).catch(() => {});
  }, [isClient, params.id]);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!product) return;
    setBusy(true);
    try {
      await cartApi.addItem(product.id, quantity);
      showToast(t('addedToCart'));
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : t('addToCartFailed'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (!product) return;
    const next = !liked;
    setLiked(next);
    try {
      if (next) await wishlistApi.add(product.id);
      else await wishlistApi.remove(product.id);
    } catch {
      setLiked(!next);
    }
  };

  if (loading) {
    return (
      <div className="page-shell py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square rounded-3xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 rounded-xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
            <div className="h-24 rounded-xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="page-shell page-shell-narrow py-20 text-center space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('productNotFound')}</p>
        <Link href="/marketplace" className="text-xs font-bold text-emerald-600 hover:underline">
          {t('backToShop')}
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell py-10 space-y-8">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
        <Icon name="chevronleft" size={14} />
        {t('backToShop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 relative">
            {product.imageUrls[activeImage] ? (
              <img src={product.imageUrls[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                <Icon name="package" size={48} />
              </div>
            )}
            {product.discountPercent != null && (
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-extrabold">
                -{product.discountPercent}%
              </span>
            )}
          </div>
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.imageUrls.map((url, idx) => (
                <Button size="raw" variant="ghost"
                  key={url}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition ${
                    idx === activeImage ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
              {product.categoryName}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {money(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-base text-slate-400 line-through">{money(product.oldPrice)}</span>
            )}
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {product.description}
          </p>

          {isClient ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500">{t('quantity')}</span>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  <Button size="raw" variant="ghost"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition"
                  >
                    <Icon name="minus" size={14} />
                  </Button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <Button size="raw" variant="ghost"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 transition"
                  >
                    <Icon name="plus" size={14} />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="raw" variant="ghost"
                  onClick={handleAddToCart}
                  disabled={busy || !product.isActive}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition"
                >
                  <Icon name="shoppingcart" size={16} />
                  {busy ? '...' : t('addToCart')}
                </Button>
                <Button size="raw" variant="ghost"
                  onClick={handleToggleWishlist}
                  className="w-14 h-14 shrink-0 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <Icon name="heart" size={20} className={liked ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                </Button>
              </div>
              {!product.isActive && (
                <p className="text-xs font-bold text-red-500">{t('productUnavailable')}</p>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 transition"
            >
              <Icon name="shoppingcart" size={16} />
              {t('loginToBuy')}
            </Link>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-2xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
