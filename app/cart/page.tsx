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
import { useMoney } from '@/lib/money';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const t = useTranslations('cart');
  const { money } = useMoney();
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
  const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
  /** Only the lines that actually carry a struck-through old price contribute. */
  const savings =
    cart?.items.reduce(
      (sum, i) => sum + (i.oldPrice ? (Number(i.oldPrice) - Number(i.unitPrice)) * i.quantity : 0),
      0,
    ) ?? 0;

  return (
    <>
    <ClientPageHeader icon="shoppingcart" eyebrow={t('badge')} title={t('title')} />
    <div className="page-shell page-shell-narrow py-12 space-y-8">

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="h-24 rounded-2xl bg-slate-50 dark:bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (!cart || cart.items.length === 0) && (
        <EmptyState
          icon="shoppingcart"
          tone="emerald"
          title={t('empty')}
          description={t('emptyDesc')}
          actionLabel={t('browseShop')}
          actionHref="/marketplace"
        />
      )}

      {!loading && cart && cart.items.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
              {t('itemsCount', { count: itemCount })}
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline"
            >
              <Icon name="arrowright" size={13} className="rotate-180" />
              {t('continueShopping')}
            </Link>
          </div>

          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={item.productId}
                className={`group relative overflow-hidden rounded-3xl border bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 transition-all duration-200 ${
                  item.isAvailable
                    ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/5'
                    : 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/10'
                }`}
              >
                {/* An unavailable line is marked by a red rail rather than by fading the
                    whole row — a 70%-opacity row is also a row you can no longer read. */}
                {!item.isAvailable && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />}

                <Link
                  href={`/marketplace/${item.productId}`}
                  className="w-full h-36 sm:w-20 sm:h-20 shrink-0 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200/70 dark:ring-slate-700/60"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Icon name="package" size={22} />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0 space-y-1">
                  <Link
                    href={`/marketplace/${item.productId}`}
                    className="block text-sm font-extrabold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-sky-400 transition-colors"
                  >
                    {item.productName}
                  </Link>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {money(item.unitPrice)}
                    </span>
                    {item.oldPrice && (
                      <>
                        <span className="text-[11px] text-slate-400 line-through">{money(item.oldPrice)}</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold">
                          −{Math.round((1 - Number(item.unitPrice) / Number(item.oldPrice)) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                  {!item.isAvailable && (
                    <p className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-600 dark:text-red-400">
                      <Icon name="X" size={12} />
                      {t('itemUnavailable')}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1" aria-label={t('quantity')}>
                    <Button size="raw" variant="ghost"
                      onClick={() => handleSetQuantity(item.productId, item.quantity - 1)}
                      disabled={busyId === item.productId || !item.isAvailable || item.quantity <= 1}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition"
                    >
                      <Icon name="minus" size={13} />
                    </Button>
                    <span className="w-7 text-center text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <Button size="raw" variant="ghost"
                      onClick={() => handleSetQuantity(item.productId, item.quantity + 1)}
                      disabled={busyId === item.productId || !item.isAvailable}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm disabled:opacity-30 transition"
                    >
                      <Icon name="plus" size={13} />
                    </Button>
                  </div>

                  <div className="text-right min-w-[92px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('lineTotal')}</p>
                    <p className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {money(item.subtotal)}
                    </p>
                  </div>

                  <Button size="raw" variant="ghost"
                    onClick={() => handleRemove(item.productId)}
                    disabled={busyId === item.productId}
                    title={t('remove')}
                    aria-label={t('remove')}
                    className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 disabled:opacity-40 transition"
                  >
                    <Icon name="trash2" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {unavailableCount > 0 && (
            <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
              <Icon name="alerttriangle" size={15} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {t('unavailableNote', { count: unavailableCount })}
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs font-bold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/5">
            <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative p-6 sm:p-7 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                  {t('summary')}
                </p>
                <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums leading-none">
                  {money(cart.totalAmount)}
                </p>
                <p className="text-xs font-semibold text-slate-400">{t('itemsCount', { count: itemCount })}</p>
                {savings > 0 && (
                  <p className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                    <Icon name="CheckCircle2" size={12} />
                    {t('saved', { amount: money(savings) })}
                  </p>
                )}
              </div>

              <Button size="raw" variant="ghost"
                onClick={handleCheckout}
                disabled={checkingOut || !canCheckout}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 disabled:opacity-50 disabled:shadow-none transition-all duration-200 btn-ripple flex items-center justify-center gap-2"
              >
                {checkingOut ? '…' : t('checkout')}
                {!checkingOut && <Icon name="arrowright" size={16} />}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
    </>
  );
}
