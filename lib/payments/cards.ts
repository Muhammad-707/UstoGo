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
  /** The brand's own logo, under `public/brands`. */
  logo: string;
  /**
   * Height for the logo in the method list and on the card face.
   *
   * One shared box would make Visa's 3:1 wordmark tower over Mastercard's 1.4:1 discs
   * or squash it, depending which side binds. Each brand is set to the height that
   * makes it read at the same optical weight as its neighbours.
   */
  listLogo: string;
  cardLogo: string;
  /** Gradient the card face is painted in — the brand's own colours. */
  gradient: string;
}

/**
 * What people in Dushanbe actually pay with: the local banks whose cards are in every
 * pocket, and the international schemes for everyone else.
 */
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'DUSHANBE_CITY',
    name: 'Душанбе Сити',
    kindKey: 'kindBankCard',
    logo: '/brands/dushanbe-city.svg',
    listLogo: 'h-6',
    cardLogo: 'h-7',
    gradient: 'from-[#0B67C4] via-[#0456A2] to-[#023E78]',
  },
  {
    id: 'ALIF',
    name: 'Alif',
    kindKey: 'kindWallet',
    logo: '/brands/alif.svg',
    listLogo: 'h-5',
    cardLogo: 'h-6',
    gradient: 'from-[#00C878] via-[#00AF66] to-[#00794A]',
  },
  {
    id: 'AMONATBONK',
    name: 'Амонатбонк',
    kindKey: 'kindBankCard',
    logo: '/brands/amonatbonk.svg',
    listLogo: 'h-3.5',
    cardLogo: 'h-4',
    gradient: 'from-[#00A855] via-[#008A45] to-[#00602F]',
  },
  {
    id: 'ESKHATA',
    name: 'Эсхата',
    kindKey: 'kindBankCard',
    logo: '/brands/eskhata.svg',
    listLogo: 'h-4',
    cardLogo: 'h-5',
    gradient: 'from-[#0A66E0] via-[#004FC7] to-[#00337F]',
  },
  {
    id: 'VISA',
    name: 'Visa',
    kindKey: 'kindInternational',
    logo: '/brands/visa.svg',
    listLogo: 'h-4',
    cardLogo: 'h-5',
    gradient: 'from-[#2A3A93] via-[#1434CB] to-[#0B1E73]',
  },
  {
    id: 'MASTERCARD',
    name: 'Mastercard',
    kindKey: 'kindInternational',
    logo: '/brands/mastercard.svg',
    listLogo: 'h-7',
    cardLogo: 'h-8',
    gradient: 'from-[#F79E1B] via-[#EB001B] to-[#8A0010]',
  },
];

/** The scheme badge printed on the card face, once the number says which scheme it is. */
export const SCHEME_LOGOS: Partial<Record<CardScheme, { src: string; className: string; label: string }>> = {
  VISA: { src: '/brands/visa.svg', className: 'h-4', label: 'Visa' },
  MASTERCARD: { src: '/brands/mastercard.svg', className: 'h-6', label: 'Mastercard' },
};

export const digitsOnly = (value: string): string => value.replace(/\D/g, '');

/** The shortest and longest a card number is anywhere in the world. */
const MIN_CARD_DIGITS = 13;
export const MAX_CARD_DIGITS = 19;

/** `4111 1111 1111 1111` — grouped as it is typed. */
export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, MAX_CARD_DIGITS).replace(/(.{4})/g, '$1 ').trim();
}

/** Which scheme issued this number — used to badge the card face, nothing more. */
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
