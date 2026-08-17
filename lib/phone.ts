/**
 * Phone numbers, as a country plus a national number — not as free text.
 *
 * What is checked, and what deliberately is not:
 *   - the country and the exact length of the national number: yes. Tajik numbers are
 *     nine digits; eight or ten is a typo, not a number.
 *   - a run of one repeated digit (`000000000`, `111111111`): rejected. No numbering
 *     plan in the world issues those, and they are what people type to get past a form.
 *   - the operator behind the prefix: **no longer checked**. The prefix table was wrong
 *     more often than it was right — real MegaFon, Beeline and Babilon numbers were
 *     being rejected because their prefix was not in a hand-written list. Operators buy,
 *     sell and open ranges constantly; a browser cannot keep up, and a form that refuses
 *     a real number is far worse than one that accepts a well-formed fake.
 *   - whether the SIM exists and answers: impossible here. That needs an SMS code or an
 *     HLR lookup from the backend.
 */

export interface PhoneCountry {
  /** ISO 3166-1 alpha-2, also the Select's value and the i18n key for the name. */
  iso: string;
  /** Country calling code, digits only, no `+`. */
  dial: string;
  flag: string;
  /** Accepted lengths of the national significant number. */
  lengths: number[];
  /** Digit groups used while typing, e.g. `[2, 3, 2, 2]` → `90 123 45 67`. */
  groups: number[];
}

/**
 * Tajikistan first — it is the product's market. The rest are where UstoGo's clients
 * actually dial from: the diaspora's countries, the neighbours, and the Gulf.
 */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: 'TJ', dial: '992', flag: '🇹🇯', lengths: [9], groups: [2, 3, 2, 2] },
  { iso: 'RU', dial: '7', flag: '🇷🇺', lengths: [10], groups: [3, 3, 2, 2] },
  { iso: 'KZ', dial: '7', flag: '🇰🇿', lengths: [10], groups: [3, 3, 2, 2] },
  { iso: 'UZ', dial: '998', flag: '🇺🇿', lengths: [9], groups: [2, 3, 2, 2] },
  { iso: 'KG', dial: '996', flag: '🇰🇬', lengths: [9], groups: [3, 3, 3] },
  { iso: 'TM', dial: '993', flag: '🇹🇲', lengths: [8], groups: [2, 3, 3] },
  { iso: 'AF', dial: '93', flag: '🇦🇫', lengths: [9], groups: [2, 3, 4] },
  { iso: 'TR', dial: '90', flag: '🇹🇷', lengths: [10], groups: [3, 3, 2, 2] },
  { iso: 'AE', dial: '971', flag: '🇦🇪', lengths: [9], groups: [2, 3, 4] },
  { iso: 'SA', dial: '966', flag: '🇸🇦', lengths: [9], groups: [2, 3, 4] },
  { iso: 'QA', dial: '974', flag: '🇶🇦', lengths: [8], groups: [4, 4] },
  { iso: 'KW', dial: '965', flag: '🇰🇼', lengths: [8], groups: [4, 4] },
  { iso: 'IR', dial: '98', flag: '🇮🇷', lengths: [10], groups: [3, 3, 4] },
  { iso: 'CN', dial: '86', flag: '🇨🇳', lengths: [11], groups: [3, 4, 4] },
  { iso: 'KR', dial: '82', flag: '🇰🇷', lengths: [9, 10], groups: [2, 4, 4] },
  { iso: 'IN', dial: '91', flag: '🇮🇳', lengths: [10], groups: [5, 5] },
  { iso: 'PK', dial: '92', flag: '🇵🇰', lengths: [10], groups: [3, 3, 4] },
  { iso: 'AZ', dial: '994', flag: '🇦🇿', lengths: [9], groups: [2, 3, 2, 2] },
  { iso: 'GE', dial: '995', flag: '🇬🇪', lengths: [9], groups: [3, 3, 3] },
  { iso: 'BY', dial: '375', flag: '🇧🇾', lengths: [9], groups: [2, 3, 2, 2] },
  { iso: 'UA', dial: '380', flag: '🇺🇦', lengths: [9], groups: [2, 3, 2, 2] },
  { iso: 'PL', dial: '48', flag: '🇵🇱', lengths: [9], groups: [3, 3, 3] },
  { iso: 'DE', dial: '49', flag: '🇩🇪', lengths: [10, 11], groups: [3, 4, 4] },
  { iso: 'GB', dial: '44', flag: '🇬🇧', lengths: [10], groups: [4, 6] },
  { iso: 'US', dial: '1', flag: '🇺🇸', lengths: [10], groups: [3, 3, 4] },
];

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0];

export function countryByIso(iso: string): PhoneCountry {
  return PHONE_COUNTRIES.find((c) => c.iso === iso) ?? DEFAULT_PHONE_COUNTRY;
}

export const digitsOf = (value: string): string => (value ?? '').replace(/\D/g, '');

/** `90 123 45 67` — the number, grouped the way the country writes it. */
export function formatNational(country: PhoneCountry, national: string): string {
  const digits = digitsOf(national).slice(0, Math.max(...country.lengths));
  const out: string[] = [];
  let i = 0;
  for (const size of country.groups) {
    if (i >= digits.length) break;
    out.push(digits.slice(i, i + size));
    i += size;
  }
  if (i < digits.length) out.push(digits.slice(i));
  return out.join(' ');
}

/** `9` or `10 / 11` — the lengths this country accepts, for the error message. */
export function lengthsLabel(country: PhoneCountry): string {
  return country.lengths.join(' / ');
}

export type PhoneProblem = 'required' | 'length' | 'repeated';

/** One digit, nine times over. Not a number anyone was ever issued. */
function isRepeatedDigits(digits: string): boolean {
  return digits.length > 1 && /^(\d)\1*$/.test(digits);
}

/** What is wrong with this national number, or `null` when nothing is. */
export function checkNational(country: PhoneCountry, national: string): PhoneProblem | null {
  const digits = digitsOf(national);
  if (digits.length === 0) return 'required';
  if (!country.lengths.includes(digits.length)) return 'length';
  if (isRepeatedDigits(digits)) return 'repeated';
  return null;
}

export function isValidPhone(country: PhoneCountry, national: string): boolean {
  return checkNational(country, national) === null;
}

/** `+992901234567` — the one shape the API is ever sent. */
export function toE164(country: PhoneCountry, national: string): string {
  return `+${country.dial}${digitsOf(national)}`;
}

/**
 * Splits a stored `+992901234567` back into a country and a national number.
 *
 * Longest dial code first, so `+99…` resolves to Tajikistan/Uzbekistan rather than to
 * nothing, and a `+7` number is not claimed by a three-digit code that starts with 7.
 */
export function parseE164(value: string | null | undefined): { country: PhoneCountry; national: string } {
  const digits = digitsOf(value ?? '');
  if (!digits) return { country: DEFAULT_PHONE_COUNTRY, national: '' };
  const byLongestDial = [...PHONE_COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const country of byLongestDial) {
    if (!digits.startsWith(country.dial)) continue;
    const national = digits.slice(country.dial.length);
    if (country.lengths.includes(national.length)) return { country, national };
  }
  // A bare national number — people type their own the way they say it.
  return { country: DEFAULT_PHONE_COUNTRY, national: digits };
}

/** `+992 90 123 45 67` — for display, never for the wire. */
export function formatE164(value: string | null | undefined): string {
  if (!value) return '';
  const { country, national } = parseE164(value);
  if (!national) return value;
  return `+${country.dial} ${formatNational(country, national)}`;
}
