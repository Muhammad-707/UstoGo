'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  CircleCheckBig,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Truck,
  X,
} from 'lucide-react';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { cartApi, ordersApi } from '@/lib/api/endpoints';
import { ApiError } from '@/lib/api/client';
import type { Cart } from '@/lib/api/types';
import { useMoney } from '@/lib/money';

import { RecommendedProducts } from '@/components/marketplace/RecommendedProducts';
import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CartPage() {
  const t = useTranslations('cart');
  const tm = useTranslations('marketplace');
  const { money } = useMoney();
  const router = useRouter();
  useRequireAuth(['CLIENT']);

  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    cartApi.get().then(setCart).catch(() => setCart(null)).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches the cart on mount
  useEffect(load, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

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

  const hasItems = !loading && cart && cart.items.length > 0;

  return (
    <>
      <ClientPageHeader icon="shoppingcart" eyebrow={t('badge')} title={t('title')} />

      <div className="page-shell space-y-14 py-6 sm:py-12">

        {loading && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 rounded-3xl" />
              ))}
            </div>
            <Skeleton className="h-64 rounded-3xl" />
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

        {hasItems && (
          /* Lines on the left, a summary that stays put on the right. The old layout
             stacked the total under a scrolling list, so on a full cart the one button
             the page exists for was below the fold. */
          <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">

            {/* Lines */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
                  {t('itemsCount', { count: itemCount })}
                </p>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 transition hover:gap-2 dark:text-sky-400"
                >
                  <ArrowLeft size={13} />
                  {t('continueShopping')}
                </Link>
              </div>

              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border bg-white p-4 transition-all duration-200 sm:flex-row sm:items-center sm:gap-5 sm:p-5 dark:bg-slate-900 ${
                    item.isAvailable
                      ? 'border-slate-200 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 dark:border-slate-800 dark:hover:border-slate-700'
                      : 'border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/10'
                  }`}
                >
                  {/* An unavailable line is marked by a red rail rather than by fading the
                      whole row — a 70%-opacity row is also a row you can no longer read. */}
                  {!item.isAvailable && <span className="absolute inset-y-0 left-0 w-1 bg-red-500" />}

                  <Link
                    href={`/marketplace/${item.productId}`}
                    className="h-36 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200/70 sm:h-20 sm:w-20 dark:bg-slate-800 dark:ring-slate-700/60"
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Package size={22} />
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-1">
                    <Link
                      href={`/marketplace/${item.productId}`}
                      className="block line-clamp-2 text-sm font-extrabold text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-sky-400"
                    >
                      {item.productName}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {money(item.unitPrice)}
                      </span>
                      {item.oldPrice && (
                        <>
                          <span className="text-[11px] text-slate-400 line-through">{money(item.oldPrice)}</span>
                          <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            −{Math.round((1 - Number(item.unitPrice) / Number(item.oldPrice)) * 100)}%
                          </span>
                        </>
                      )}
                    </div>
                    {!item.isAvailable && (
                      <p className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-600 dark:text-red-400">
                        <X size={12} />
                        {t('itemUnavailable')}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end sm:gap-5">
                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800" aria-label={t('quantity')}>
                      <Button
                        size="raw"
                        variant="ghost"
                        onClick={() => handleSetQuantity(item.productId, item.quantity - 1)}
                        disabled={busyId === item.productId || !item.isAvailable || item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white hover:shadow-sm disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Minus size={13} />
                      </Button>
                      <span className="w-7 text-center text-sm font-extrabold text-slate-900 tabular-nums dark:text-white">
                        {item.quantity}
                      </span>
                      <Button
                        size="raw"
                        variant="ghost"
                        onClick={() => handleSetQuantity(item.productId, item.quantity + 1)}
                        disabled={busyId === item.productId || !item.isAvailable}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white hover:shadow-sm disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Plus size={13} />
                      </Button>
                    </div>

                    <div className="min-w-[92px] text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{t('lineTotal')}</p>
                      <p className="text-base font-extrabold text-slate-900 tabular-nums dark:text-white">
                        {money(item.subtotal)}
                      </p>
                    </div>

                    <Button
                      size="raw"
                      variant="ghost"
                      onClick={() => handleRemove(item.productId)}
                      disabled={busyId === item.productId}
                      title={t('remove')}
                      aria-label={t('remove')}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:text-slate-600 dark:hover:bg-red-950/40"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}

              {unavailableCount > 0 && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {t('unavailableNote', { count: unavailableCount })}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-[88px]">
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
                <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative space-y-5 p-6">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-slate-400">
                    {t('summary')}
                  </p>

                  <div className="space-y-2.5 border-b border-slate-100 pb-5 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>{t('itemsCount', { count: itemCount })}</span>
                      <span className="tabular-nums">{money(cart.totalAmount)}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CircleCheckBig size={12} />
                          {t('savingsLabel')}
                        </span>
                        <span className="tabular-nums">−{money(savings)}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{t('total')}</p>
                    <p className="mt-1 text-4xl font-extrabold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
                      {money(cart.totalAmount)}
                    </p>
                  </div>

                  <Button
                    size="raw"
                    variant="ghost"
                    onClick={handleCheckout}
                    disabled={checkingOut || !canCheckout}
                    className="btn-ripple flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-600/40 disabled:opacity-50 disabled:shadow-none"
                  >
                    {checkingOut ? '…' : t('checkout')}
                    {!checkingOut && <ArrowRight size={16} />}
                  </Button>

                  {/* Reassurance sits next to the button, where the hesitation is. */}
                  <ul className="space-y-2.5 pt-1">
                    <li className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                      {t('trustSecure')}
                    </li>
                    <li className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <Truck size={14} className="shrink-0 text-emerald-500" />
                      {tm('heroNote')}
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        )}

        {!loading && (
          <RecommendedProducts
            excludeIds={cart?.items.map((i) => i.productId) ?? []}
            onAdded={(message) => {
              showToast(message);
              load();
            }}
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
