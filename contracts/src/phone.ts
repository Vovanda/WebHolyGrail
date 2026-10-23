/**
 * Форматы телефона: как проверить номер и какой показать пример.
 *
 * @remarks
 * Шаблоном пользуются сайты разных стран, и номер там пишут по-разному, поэтому
 * правило не зашито в анкету, а выбирается владельцем в настройках магазина.
 * По умолчанию международный: он принимает номер любой страны целиком. Обрывки
 * короче 8 цифр, которые раньше проходили (и городской номер без кода), теперь
 * отклоняются - по ним продавец не дозвонится.
 */
export interface PhoneFormat {
  readonly title: string;
  /** Пример номера для подсказки в анкете. */
  readonly example: string;
  /** Подходит ли количество цифр номера. */
  readonly digits: (count: number, first: string) => boolean;
}

export const PHONE_FORMATS = {
  intl: {
    title: 'Международный',
    example: '+44 20 7946 0958',
    // E.164: не больше 15 цифр вместе с кодом страны; короче 8 - обрывок.
    digits: (count) => count >= 8 && count <= 15,
  },
  ru: {
    title: 'Россия',
    example: '+7 900 123-45-67',
    // 10 цифр без кода или 11 с кодом 7 или 8.
    digits: (count, first) => count === 10 || (count === 11 && (first === '7' || first === '8')),
  },
} as const satisfies Record<string, PhoneFormat>;

export type PhoneFormatKey = keyof typeof PHONE_FORMATS;

export const DEFAULT_PHONE_FORMAT: PhoneFormatKey = 'intl';

export function isPhoneFormat(value: unknown): value is PhoneFormatKey {
  return typeof value === 'string' && Object.hasOwn(PHONE_FORMATS, value);
}

/** Номер целиком в выбранном формате: только цифры, пробелы, скобки, дефисы и плюс в начале. */
export function checkPhone(raw: string, format: PhoneFormatKey = DEFAULT_PHONE_FORMAT): boolean {
  if (!/^\+?[\d\s()-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  return PHONE_FORMATS[format].digits(digits.length, digits[0] ?? '');
}
