/**
 * Правила выдачи кода доступа: длина, срок самого кода, срок открываемого права.
 *
 * @remarks
 * Все три владелец правит в настройках сайта, поэтому числа не могут стоять
 * в местах, где код выпускается. Здесь они превращаются из настройки в правило,
 * а решение, каким быть коду, принимается уже по правилу - без базы и без сети.
 */

/** Шесть символов - около миллиарда вариантов; хватает, пока код живёт минуты. */
const DEFAULT_LENGTH = 6;

/** Пять минут: столько код идёт от выдавшего к тому, кто вводит. */
const DEFAULT_TTL_MINUTES = 5;

/** Месяц доступа - привычный срок подписки и подарка. */
const DEFAULT_GRANT_DAYS = 30;

export interface CodeRules {
  /** Сколько символов в выдаваемом коде. */
  readonly length: number;
  /** Сколько минут код годен к вводу. */
  readonly ttlMinutes: number;
  /** На сколько дней сработавший код открывает доступ. */
  readonly grantDays: number;
}

/** То, что лежит в настройках сайта; любое поле может быть не заполнено. */
export interface VideoCodeSettings {
  readonly codeLength?: string | number | null;
  readonly codeTtlMinutes?: number | null;
  readonly accessDays?: number | null;
}

/**
 * Читает правила из настроек, подставляя умолчания вместо незаполненного.
 *
 * @remarks
 * Настройки приходят из базы, где полем может оказаться что угодно: пустая
 * строка от очищенного поля, ноль, отрицательное число из чужой миграции.
 * Всё, что не годится в срок, заменяется умолчанием - иначе неверная настройка
 * выдаст код, который просрочен в момент выдачи.
 */
export function codeRules(settings: VideoCodeSettings | null | undefined): CodeRules {
  return {
    length: positive(settings?.codeLength) ?? DEFAULT_LENGTH,
    ttlMinutes: positive(settings?.codeTtlMinutes) ?? DEFAULT_TTL_MINUTES,
    grantDays: positive(settings?.accessDays) ?? DEFAULT_GRANT_DAYS,
  };
}

/** Срок кода, выданного в этот момент. */
export function codeExpiry(rules: CodeRules, now: Date): string {
  return new Date(now.getTime() + rules.ttlMinutes * 60 * 1000).toISOString();
}

function positive(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return Math.floor(number);
}
