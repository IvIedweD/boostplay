import { describe, expect, it } from 'vitest';
import { validatePlayerName } from './validatePlayerName';

describe('имя игрока', () => {
  it('принимает русские и латинские символы, цифры и разделители', () => {
    expect(validatePlayerName('  Игрок-42_Test  ')).toEqual({
      valid: true,
      value: 'Игрок-42_Test',
    });
  });

  it('отклоняет пустое, слишком длинное и неподдерживаемое имя', () => {
    expect(validatePlayerName('   ').valid).toBe(false);
    expect(validatePlayerName('123456789012345678901').valid).toBe(false);
    expect(validatePlayerName('Игрок🎲').valid).toBe(false);
  });
});
