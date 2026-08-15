import * as yup from 'yup';

/**
 * Every field of the booking address, as one schema.
 *
 * The wizard used to gate its "review order" button on `!district || !street.trim()` and
 * nothing else: a client could reach the confirmation screen with no house number and no
 * phone, and the master then had an accepted job at "Исмоили Сомонӣ" with no way to ring
 * the door or the person behind it. A schema states all of it in one place, in the
 * reader's own language, and hands back a message per field instead of one disabled
 * button that never says why.
 *
 * The messages are injected rather than hardcoded because yup resolves them at schema
 * build time, and this app's copy lives in `next-intl`.
 */
export interface AddressMessages {
  city: string;
  district: string;
  street: string;
  streetShort: string;
  house: string;
  phone: string;
  phoneInvalid: string;
}

/** Digits only, so the same number validates whether it was typed with spaces or without. */
export const digitsOf = (value: string): string => value.replace(/\D/g, '');

/**
 * Tajik mobile numbers are `+992` plus nine digits. A bare nine digits is accepted and
 * normalised — people type their own number the way they say it, not the way a database
 * stores it.
 */
export function isTajikPhone(value: string): boolean {
  const digits = digitsOf(value);
  if (digits.length === 12) return digits.startsWith('992');
  return digits.length === 9;
}

/** `+992XXXXXXXXX` — the one shape the API is sent, whatever was typed. */
export function normalizeTajikPhone(value: string): string {
  const digits = digitsOf(value);
  return `+${digits.length === 9 ? `992${digits}` : digits}`;
}

export function buildAddressSchema(m: AddressMessages) {
  return yup.object({
    cityId: yup.string().trim().required(m.city),
    district: yup.string().trim().required(m.district),
    street: yup.string().trim().required(m.street).min(3, m.streetShort),
    house: yup.string().trim().required(m.house),
    contactPhone: yup
      .string()
      .trim()
      .required(m.phone)
      .test('tj-phone', m.phoneInvalid, (value) => isTajikPhone(value ?? '')),
  });
}

export type AddressValues = yup.InferType<ReturnType<typeof buildAddressSchema>>;
export type AddressField = keyof AddressValues;

/**
 * Validates the whole object and returns every failure at once, keyed by field.
 *
 * `abortEarly: false` on purpose: showing one error, then the next one after the reader
 * fixes it, is how a four-field form takes four round trips.
 */
export async function validateAddress(
  schema: ReturnType<typeof buildAddressSchema>,
  values: Record<AddressField, string>,
): Promise<Partial<Record<AddressField, string>>> {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (err) {
    if (!(err instanceof yup.ValidationError)) throw err;
    const errors: Partial<Record<AddressField, string>> = {};
    for (const issue of err.inner.length > 0 ? err.inner : [err]) {
      const field = issue.path as AddressField | undefined;
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return errors;
  }
}
