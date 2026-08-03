import type { SiteSettings } from 'contracts';

/**
 * Реквизиты оператора персональных данных из настроек сайта.
 *
 * @remarks
 * Живут в настройках, а не в тексте страницы: реквизиты повторяются в политике
 * несколько раз, а при смене адреса или подаче уведомления их пришлось бы
 * искать по всему документу. Текст политики при этом остаётся обычной
 * страницей — владелец правит формулировки, не трогая реквизиты.
 */
export interface PersonalDataSettings {
  readonly operatorName?: string;
  readonly operatorInn?: string;
  readonly operatorAddress?: string;
  readonly contactEmail?: string;
  readonly rknRegistryNumber?: string;
  readonly rknNotified?: boolean;
  readonly policyUpdatedAt?: string;
}

/** Метки, которые можно ставить в тексте страницы. */
const LABELS: Record<string, string> = {
  operatorName: 'название оператора',
  operatorInn: 'ИНН',
  operatorAddress: 'адрес',
  contactEmail: 'почта для обращений',
  rknRegistryNumber: 'номер записи в реестре Роскомнадзора',
  policyUpdatedAt: 'дата редакции',
};

const PLACEHOLDER = /\{\{\s*([a-zA-Z]+)\s*\}\}/g;

function readable(key: string, value: string): string {
  if (key !== 'policyUpdatedAt') return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Подставляет реквизиты вместо меток `{{operatorName}}`.
 *
 * @remarks
 * Незаполненное поле не выкидывается молча, а превращается в заметную скобку
 * «[укажите ИНН]»: пустое место в юридическом документе выглядит как готовый
 * текст, и его легко не заметить.
 */
export function fillPersonalData(
  text: string,
  data: PersonalDataSettings | undefined,
): { readonly text: string; readonly missing: readonly string[] } {
  const missing: string[] = [];

  const filled = text.replace(PLACEHOLDER, (whole, rawKey: string) => {
    const key = rawKey as keyof PersonalDataSettings;
    if (!(rawKey in LABELS)) return whole;

    const value = data?.[key];
    if (typeof value === 'string' && value.trim()) return readable(rawKey, value);

    missing.push(LABELS[rawKey]!);
    return `[укажите: ${LABELS[rawKey]}]`;
  });

  return { text: filled, missing: [...new Set(missing)] };
}

/** Реквизиты страницы из настроек сайта — с учётом того, что группы может не быть. */
export function personalDataOf(settings: SiteSettings | null | undefined): PersonalDataSettings {
  return ((settings as { personalData?: PersonalDataSettings } | null)?.personalData ??
    {}) as PersonalDataSettings;
}
