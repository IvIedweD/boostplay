import { describe, expect, it } from 'vitest';
import { getPasswordRules, isStrongPassword } from './passwordPolicy';

describe('политика пароля BOOSTPLAY', () => {
  it('требует длину, буквы обоих регистров и цифру', () => {
    expect(isStrongPassword('weak')).toBe(false);
    expect(isStrongPassword('Strong2026')).toBe(true);
    expect(getPasswordRules('Strong2026').every((rule) => rule.satisfied)).toBe(true);
  });
});
