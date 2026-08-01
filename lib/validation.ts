export type ValidationErrorKey =
  | 'required'
  | 'invalidEmail'
  | 'passwordTooShort'
  | 'nameTooShort'
  | 'invalidPhone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Backend expects strict E.164: +<countrycode><subscriber>, 8-15 digits total.
const E164_RE = /^\+[1-9]\d{7,14}$/;

export function validateEmail(value: string): ValidationErrorKey | null {
  if (!value.trim()) return 'required';
  if (!EMAIL_RE.test(value.trim())) return 'invalidEmail';
  return null;
}

export function validatePassword(value: string): ValidationErrorKey | null {
  if (!value) return 'required';
  if (value.length < 8) return 'passwordTooShort';
  return null;
}

export function validateName(value: string): ValidationErrorKey | null {
  if (!value.trim()) return 'required';
  if (value.trim().length < 2) return 'nameTooShort';
  return null;
}

export function validatePhone(value: string): ValidationErrorKey | null {
  if (!value.trim()) return 'required';
  if (!E164_RE.test(value.trim())) return 'invalidPhone';
  return null;
}

// Normalizes local Tajik numbers (e.g. "90 123 4567" or "992901234567") into E.164 (+992901234567).
export function normalizePhone(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('992')) return `+${digits}`;
  return `+992${digits}`;
}

export function validateRequired(value: string): ValidationErrorKey | null {
  return value.trim() ? null : 'required';
}
