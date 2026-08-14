'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Package, ShoppingCart } from 'lucide-react';

import type { Product } from '@/lib/api/types';
import { useMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface ProductCardProps {
  product: Product;
  /** Shown as filled when the product is already on the wishlist. */
  liked?: boolean;
  /** Omit to hide the heart entirely (guests, or a list where it makes no sense). */
  onToggleWishlist?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  busy?: boolean;
  addToCartLabel: string;
  wishlistLabel: string;
}

/**
 * One product, everywhere it appears — the shop grid, the wishlist, and the
 * recommendation rails under the cart. There were three near-identical copies of this
 * markup before, and they had already drifted: only one of them formatted the old price
 * through `useMoney`, so the same product showed "1050.00" on the wishlist and
 * "1,050.00 TJS" in the shop.
 */
export function ProductCard({
  product,
  liked = false,
  onToggleWishlist,
  onAddToCart,
  busy = false,
  addToCartLabel,
  wishlistLabel,
}: ProductCardProps) {
  const { money } = useMoney();

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1.5 hover:border-emerald-200 hover:shadow-[0_24px_48px_-24px_rgba(16,185,129,0.35)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900/80">
      <Link
        href={`/marketplace/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800"
      >
        {product.imageUrls[0] ? (
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.08]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300 dark:text-slate-600">
            <Package size={34} />
          </div>
        )}

        {product.discountPercent != null && (
          <span className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-lg shadow-rose-600/30">
            −{product.discountPercent}%
          </span>
        )}

        {onToggleWishlist && (
          <Button
            size="raw"
            variant="ghost"
            aria-label={wishlistLabel}
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur transition hover:scale-110 dark:bg-slate-900/95"
          >
            <Heart size={16} className={cn(liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400')} />
          </Button>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
          {product.categoryName}
        </p>
        <Link
          href={`/marketplace/${product.id}`}
          className="line-clamp-2 flex-1 text-sm font-bold text-slate-900 transition-colors hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-slate-900 dark:text-white">{money(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-slate-400 line-through">{money(product.oldPrice)}</span>
          )}
        </div>

        {onAddToCart && (
          <Button
            size="raw"
            variant="ghost"
            onClick={() => onAddToCart(product)}
            disabled={busy || !product.isActive}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-emerald-400"
          >
            <ShoppingCart size={13} />
            {busy ? '…' : addToCartLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ProductCard;
