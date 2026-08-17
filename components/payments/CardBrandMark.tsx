import React from 'react';
import { cn } from '@/lib/utils';

/**
 * The payment brands, drawn rather than downloaded.
 *
 * A checkout that hotlinks logo files from other companies' servers is one 404 away from
 * a grid of broken images, adds a request per tile, and looks different on every reload
 * while the images stream in. These are vectors: they ship with the page, render at any
 * size, and never fail. Each is the brand's own mark — Mastercard's interlocking discs,
 * the Visa wordmark — or, for the Tajik banks, their wordmark in their own colour, set
 * on a card-shaped tile.
 */

export type BrandId =
  | 'DUSHANBE_CITY'
  | 'ALIF'
  | 'AMONATBONK'
  | 'ESKHATA'
  | 'KORTI_MILLI'
  | 'VISA'
  | 'MASTERCARD';

interface MarkProps {
  brand: BrandId;
  className?: string;
}

/** Marks that declare gradients or clip paths need ids unique to their instance. */
interface MarkInnerProps {
  uid: string;
}

const CARD = 'block h-full w-full';

/** Rounded card plate every mark sits on. */
function Plate({ fill, children }: { fill: string; children?: React.ReactNode }) {
  return (
    <>
      <rect x="0" y="0" width="100" height="64" rx="9" fill={fill} />
      {children}
    </>
  );
}

function DushanbeCity({ uid }: MarkInnerProps) {
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-dc`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <Plate fill={`url(#${uid}-dc)`} />
      {/* A skyline, because the bank is named after the city. */}
      <g fill="#FFFFFF" opacity="0.9">
        <rect x="14" y="34" width="7" height="16" rx="1.5" />
        <rect x="24" y="26" width="8" height="24" rx="1.5" />
        <rect x="35" y="30" width="6" height="20" rx="1.5" />
        <rect x="44" y="20" width="9" height="30" rx="1.5" />
        <rect x="56" y="28" width="7" height="22" rx="1.5" />
        <rect x="66" y="33" width="8" height="17" rx="1.5" />
        <rect x="77" y="24" width="6" height="26" rx="1.5" />
      </g>
      <rect x="12" y="52" width="76" height="2.4" rx="1.2" fill="#FFFFFF" opacity="0.55" />
    </>
  );
}

function Alif() {
  return (
    <>
      <Plate fill="#0B8A5B" />
      <text
        x="50"
        y="41"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="26"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="#FFFFFF"
      >
        alif
      </text>
      <circle cx="72" cy="21" r="3.4" fill="#7CE7B0" />
    </>
  );
}

function Amonatbonk() {
  return (
    <>
      <Plate fill="#0F7A3D" />
      {/* The bank's emblem reads as a stylised "A" over an open book of accounts. */}
      <path d="M50 16 L64 44 H56 L50 30 L44 44 H36 Z" fill="#FFFFFF" />
      <rect x="34" y="47" width="32" height="3" rx="1.5" fill="#FCD34D" />
    </>
  );
}

function Eskhata() {
  return (
    <>
      <Plate fill="#C1121F" />
      <text
        x="50"
        y="40"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="18"
        fontWeight="800"
        letterSpacing="0.5"
        fill="#FFFFFF"
      >
        Эсхата
      </text>
      <rect x="30" y="46" width="40" height="2.6" rx="1.3" fill="#FDE68A" />
    </>
  );
}

function KortiMilli() {
  return (
    <>
      <Plate fill="#14532D" />
      <text
        x="50"
        y="29"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill="#FFFFFF"
      >
        КОРТИ
      </text>
      <text
        x="50"
        y="46"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="14"
        fontWeight="800"
        fill="#FBBF24"
      >
        МИЛЛӢ
      </text>
    </>
  );
}

function Visa() {
  return (
    <>
      <Plate fill="#FFFFFF" />
      <rect x="0.6" y="0.6" width="98.8" height="62.8" rx="8.4" fill="none" stroke="#E2E8F0" strokeWidth="1.2" />
      <text
        x="50"
        y="41"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        fontSize="25"
        fontWeight="800"
        fontStyle="italic"
        letterSpacing="1.5"
        fill="#1A1F71"
      >
        VISA
      </text>
      <path d="M26 47 H74 L70 51 H22 Z" fill="#F7B600" />
    </>
  );
}

function Mastercard({ uid }: MarkInnerProps) {
  return (
    <>
      <Plate fill="#FFFFFF" />
      <rect x="0.6" y="0.6" width="98.8" height="62.8" rx="8.4" fill="none" stroke="#E2E8F0" strokeWidth="1.2" />
      <defs>
        <clipPath id={`${uid}-mc`}>
          <circle cx="42" cy="32" r="17" />
        </clipPath>
      </defs>
      <circle cx="42" cy="32" r="17" fill="#EB001B" />
      <circle cx="58" cy="32" r="17" fill="#F79E1B" />
      {/* The overlap: the orange disc clipped to the red one, in Mastercard's amber. */}
      <circle cx="58" cy="32" r="17" fill="#FF5F00" clipPath={`url(#${uid}-mc)`} />
    </>
  );
}

const MARKS: Record<BrandId, (props: MarkInnerProps) => React.JSX.Element> = {
  DUSHANBE_CITY: DushanbeCity,
  ALIF: Alif,
  AMONATBONK: Amonatbonk,
  ESKHATA: Eskhata,
  KORTI_MILLI: KortiMilli,
  VISA: Visa,
  MASTERCARD: Mastercard,
};

/** One brand, drawn on a card-shaped plate. Sized entirely by its container. */
export function CardBrandMark({ brand, className }: MarkProps) {
  const uid = React.useId().replace(/[^a-zA-Z0-9-]/g, '');
  const Mark = MARKS[brand];
  if (!Mark) return null;
  return (
    <svg viewBox="0 0 100 64" className={cn(CARD, className)} role="img" aria-label={brand}>
      <Mark uid={uid} />
    </svg>
  );
}
