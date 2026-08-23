export function validatePlayerName(value: string) {
  const name = value.trim();
  if (!name) return { valid: false as const, error: 'Имя не может быть пустым' };
  if (name.length > 20) return { valid: false as const, error: 'Максимум 20 символов' };
  if (!/^[\p{L}\p{N} _-]+$/u.test(name)) {
    return { valid: false as const, error: 'Используйте буквы, цифры, пробел, дефис или подчёркивание' };
  }
  return { valid: true as const, value: name };
}
