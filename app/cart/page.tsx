'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/LucideIcons';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cartApi, ordersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Cart } from '@/lib/api/types';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';

export default function CartPage() {
  const t = useTranslations('cart');
  const router = useRouter();
  useRequireAuth(['CLIENT']);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);

  const load = () => {
    setLoading(true);
    cartApi.get().then(setCart).catch(() => setCart(null)).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the cart on mount
  useEffect(load, []);

  const handleSetQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setBusyId(productId);
    try {
      const updated = await cartApi.setQuantity(productId, quantity);
      setCart(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('updateFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    try {
      await cartApi.removeItem(productId);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('updateFailed'));
      setBusyId(null);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    setError(null);
    try {
      const order = await ordersApi.checkout();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('checkoutFailed'));
      setCheckingOut(false);
    }
  };

  const unavailableCount = cart?.items.filter((i) => !i.isAvailable).length ?? 0;
  const canCheckout = !!cart && cart.items.length > 0 && cart.items.some((i) => i.isAvailable);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <ClientPageHeader icon="shoppingcart" eyebrow={t('badge')} title={t('title')} />

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (!cart || cart.items.length === 0) && (
        <div className="glass-card rounded-3xl p-12 text-center space-y-3">
          <Icon name="shoppingcart" size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('empty')}</p>
          <Link href="/marketplace" className="inline-block text-xs font-bold text-emerald-600 hover:underline">
            {t('browseShop')}
          </Link>
        </div>
      )}

      {!loading && cart && cart.items.length > 0 && (
        <>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className={`glass-card rounded-2xl p-4 border flex items-center gap-4 ${
                  item.isAvailable ? 'border-slate-200 dark:border-slate-800' : 'border-red-200 dark:border-red-900/50 opacity-70'
                }`}
              >
                <Link href={`/marketplace/${item.productId}`} className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Icon name="package" size={20} />
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${item.productId}`} className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {item.productName}
                  </Link>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {item.unitPrice} {item.currency}
                    </span>
                    {item.oldPrice && <span className="text-[10px] text-slate-400 line-through">{item.oldPrice}</span>}
                  </div>
                  {!item.isAvailable && (
                    <p className="text-[10px] font-bold text-red-500 mt-1">{t('itemUnavailable')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => handleSetQuantity(item.productId, item.quantity - 1)}
                    disabled={busyId === item.productId || !item.isAvailable}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <Icon name="minus" size={12} />
                  </button>
                  <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                  <button
                    onClick={() => handleSetQuantity(item.productId, item.quantity + 1)}
                    disabled={busyId === item.productId || !item.isAvailable}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 disabled:opacity-40 transition"
                  >
                    <Icon name="plus" size={12} />
                  </button>
                </div>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white shrink-0 w-20 text-right">
                  {item.subtotal}
                </span>
                <button
                  onClick={() => handleRemove(item.productId)}
                  disabled={busyId === item.productId}
                  className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                >
                  <Icon name="trash2" size={15} />
                </button>
              </div>
            ))}
          </div>

          {unavailableCount > 0 && (
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">{t('unavailableNote', { count: unavailableCount })}</p>
          )}

          {error && <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}

          <div className="glass-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400">{t('total')}</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {cart.totalAmount} {cart.currency ?? ''}
              </p>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkingOut || !canCheckout}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/25 disabled:opacity-50 transition"
            >
              {checkingOut ? '...' : t('checkout')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
