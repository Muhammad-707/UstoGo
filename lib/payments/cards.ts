import type { BrandId } from '@/components/payments/CardBrandMark';

/**
 * Card data, checked the way a checkout checks it — locally, and only for the things a
 * form can actually know.
 *
 * There is no Luhn check here, on purpose. This checkout does not talk to an acquirer
 * (see `components/payments/PaymentDialog.tsx`), so a checksum would reject exactly the
 * numbers it exists to accept: made-up ones, typed to walk the flow. The length is
 * checked because a half-typed number is a mistake in any world; the checksum belongs
 * with the bank that can verify it.
 */

export type CardScheme = 'VISA' | 'MASTERCARD' | 'KORTI_MILLI' | 'UNKNOWN';

export interface PaymentMethod {
  id: string;
  /** Shown as-is in every locale — these are brand names, not copy. */
  name: string;
  /** Sub-label key in the `checkout` namespace. */
  kindKey: 'kindBankCard' | 'kindWallet' | 'kindInternational';
  /** The drawn logo for this brand. */
  brand: BrandId;
  /** Gradient the full-size card preview is painted in. */
  gradient: string;
}

/**
 * What people in Dushanbe actually pay with: the two local processors, the banks whose
 * cards are in every pocket, and the international schemes for everyone else.
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'DUSHANBE_CITY',
    name: 'Душанбе Сити',
    kindKey: 'kindBankCard',
    brand: 'DUSHANBE_CITY',
    gradient: 'from-sky-500 via-blue-600 to-blue-800',
  },
  {
    id: 'ALIF',
    name: 'Alif',
    kindKey: 'kindWallet',
    brand: 'ALIF',
    gradient: 'from-emerald-500 via-emerald-600 to-teal-700',
  },
  {
    id: 'AMONATBONK',
    name: 'Амонатбонк',
    kindKey: 'kindBankCard',
    brand: 'AMONATBONK',
    gradient: 'from-green-600 via-green-700 to-emerald-800',
  },
  {
    id: 'ESKHATA',
    name: 'Эсхата',
    kindKey: 'kindBankCard',
    brand: 'ESKHATA',
    gradient: 'from-rose-500 via-red-600 to-red-800',
  },
  {
    id: 'VISA',
    name: 'Visa',
    kindKey: 'kindInternational',
    brand: 'VISA',
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
  },
  {
    id: 'MASTERCARD',
    name: 'Mastercard',
    kindKey: 'kindInternational',
    brand: 'MASTERCARD',
    gradient: 'from-orange-500 via-rose-600 to-rose-800',
  },
];

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** The shortest and longest a card number is anywhere in the world. */
const MIN_CARD_DIGITS = 13;
export const MAX_CARD_DIGITS = 19;

/** `4111 1111 1111 1111` — grouped as it is typed. */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, MAX_CARD_DIGITS).replace(/(.{4})/g, '$1 ').trim();
}

/** Which scheme issued this number — used to badge the card preview, nothing more. */
export function schemeOf(number: string): CardScheme {
  const digits = digitsOnly(number);
  if (/^4/.test(digits)) return 'VISA';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'MASTERCARD';
  // Korti Milli, the Tajik national scheme, issues in the 9xxx range.
  if (/^9/.test(digits)) return 'KORTI_MILLI';
  return 'UNKNOWN';
}

/** `MM/YY`, kept typable: the slash appears on its own after the month. */
export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export type ExpiryProblem = 'incomplete' | 'month' | 'expired';

export function checkExpiry(value: string, now = new Date()): ExpiryProblem | null {
  const digits = digitsOnly(value);
  if (digits.length !== 4) return 'incomplete';
  const month = Number(digits.slice(0, 2));
  const year = 2000 + Number(digits.slice(2));
  if (month < 1 || month > 12) return 'month';
  // A card is good through the last day of its printed month.
  const expiresAfter = new Date(year, month, 1);
  if (expiresAfter <= now) return 'expired';
  return null;
}

export interface CardFormValues {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
}

export type CardField = keyof CardFormValues;

export interface CardMessages {
  numberRequired: string;
  numberShort: string;
  holderRequired: string;
  expiryIncomplete: string;
  expiryMonth: string;
  expiryExpired: string;
  cvvInvalid: string;
}

/** Every problem with the card at once — one message per field, or an empty object. */
export function validateCard(values: CardFormValues, m: CardMessages): Partial<Record<CardField, string>> {
  const errors: Partial<Record<CardField, string>> = {};
  const number = digitsOnly(values.number);

  if (!number) errors.number = m.numberRequired;
  else if (number.length < MIN_CARD_DIGITS) errors.number = m.numberShort;

  if (!values.holder.trim()) errors.holder = m.holderRequired;

  const expiry = checkExpiry(values.expiry);
  if (expiry === 'incomplete') errors.expiry = m.expiryIncomplete;
  else if (expiry === 'month') errors.expiry = m.expiryMonth;
  else if (expiry === 'expired') errors.expiry = m.expiryExpired;

  if (!/^\d{3,4}$/.test(digitsOnly(values.cvv))) errors.cvv = m.cvvInvalid;

  return errors;
}
