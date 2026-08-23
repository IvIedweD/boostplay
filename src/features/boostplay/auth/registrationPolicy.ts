export const ALLOWED_EMAIL_DOMAIN = 'yandex-team.ru';

export interface RegistrationIdentity {
  email: string;
  displayName: string;
}

export function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase('en-US');
}

export function isAllowedRegistrationEmail(value: string) {
  const email = normalizeEmail(value);
  const separator = email.lastIndexOf('@');
  if (separator <= 0 || separator === email.length - 1) return false;
  if (email.indexOf('@') !== separator) return false;
  return email.slice(separator + 1) === ALLOWED_EMAIL_DOMAIN;
}

export function createRegistrationIdentity(value: string): RegistrationIdentity | null {
  const email = normalizeEmail(value);
  if (!isAllowedRegistrationEmail(email)) return null;
  return {
    email,
    displayName: email.slice(0, email.lastIndexOf('@')),
  };
}

export function normalizeReferralCode(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9_-]{4,32}$/.test(normalized) ? normalized : null;
}

