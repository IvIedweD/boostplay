export interface PasswordRule {
  id: 'length' | 'lowercase' | 'uppercase' | 'number';
  label: string;
  satisfied: boolean;
}

export function getPasswordRules(password: string): PasswordRule[] {
  return [
    { id: 'length', label: 'Не менее 8 символов', satisfied: password.length >= 8 },
    { id: 'lowercase', label: 'Строчная буква', satisfied: /[a-zа-яё]/u.test(password) },
    { id: 'uppercase', label: 'Заглавная буква', satisfied: /[A-ZА-ЯЁ]/u.test(password) },
    { id: 'number', label: 'Хотя бы одна цифра', satisfied: /\d/u.test(password) },
  ];
}

export function isStrongPassword(password: string) {
  return getPasswordRules(password).every((rule) => rule.satisfied);
}
