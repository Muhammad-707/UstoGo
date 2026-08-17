import * as yup from 'yup';
import { digitsOf, isValidPhone, parseE164, toE164 } from '@/lib/phone';

export { digitsOf };

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

/**
 * The contact number, checked against the numbering plan of the country it claims.
 *
 * `PhoneField` already hands this schema an E.164 string and refuses to produce a
 * malformed one, so this is the second gate rather than the first: it exists because a
 * form must never depend on a widget for its correctness.
 */
export function isValidContactPhone(value: string): boolean {
  const digits = digitsOf(value);
  if (!digits) return false;
  const { country, national } = parseE164(value.startsWith('+') ? value : `+${digits}`);
  return isValidPhone(country, national);
}

/** `+992XXXXXXXXX` — the one shape the API is sent, whatever was typed. */
export function normalizePhone(value: string): string {
  const digits = digitsOf(value);
  if (!digits) return '';
  const { country, national } = parseE164(value.startsWith('+') ? value : `+${digits}`);
  return toE164(country, national);
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
      .test('phone', m.phoneInvalid, (value) => isValidContactPhone(value ?? '')),
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
