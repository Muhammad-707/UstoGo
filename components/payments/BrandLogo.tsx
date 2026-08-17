import React from 'react';
import { cn } from '@/lib/utils';

export interface BrandLogoProps {
  /** A file under `public/brands` — every one of them a vector, served from our own origin. */
  src: string;
  alt: string;
  /** Height utility, tuned per brand: see `PAYMENT_METHODS`. */
  className?: string;
  /**
   * Render the mark in flat white, the way a bank prints its own logo on a coloured
   * card. `brightness-0` crushes every colour to black, `invert` flips it to white —
   * one rule that works on any logo, however many colours it has.
   */
  mono?: boolean;
}

/**
 * A payment brand's own logo.
 *
 * These are the official files — pulled from each bank's site and from the schemes'
 * published assets — cleaned of their fixed width/height so CSS decides the size, and
 * served from `public/brands` rather than hotlinked, so the grid cannot arrive as six
 * broken images and no third party learns who is looking at this checkout.
 *
 * Logos have wildly different proportions (Visa's wordmark is 3:1, Mastercard's discs are
 * 1.4:1). Sizing them all to one box makes half of them look shrunken, so each carries
 * its own height and keeps its aspect ratio.
 */
export function BrandLogo({ src, alt, className, mono }: BrandLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a local static vector; next/image neither optimises nor helps with SVG
    <img
      src={src}
      alt={alt}
      className={cn('w-auto max-w-full object-contain object-left', mono && 'brightness-0 invert', className)}
    />
  );
}
