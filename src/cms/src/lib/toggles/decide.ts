/**
 * Решение: включён ли признак прямо сейчас.
 *
 * @remarks
 * Здесь живёт вся логика переключателей, и она ничего не знает ни про базу, ни
 * про админку - на входе описание признака, на выходе да или нет. Так решение
 * проверяется без запуска сайта, а хранилище можно заменить, не трогая правила.
 *
 * Порядок разбора: сначала назначенное время, потом галочка окружения. Время
 * главнее, потому что его ставят осознанно и заранее: «включить в понедельник
 * в девять» должно сработать само, без дежурного у переключателя.
 */

/** Где спрашивают: у разработчика, на пробном сайте или на рабочем. */
export type ToggleEnvironment = 'development' | 'staging' | 'production';

/** Описание признака - то, что лежит в хранилище. */
export interface ToggleRecord {
  readonly key: string;
  readonly production?: boolean | null;
  readonly staging?: boolean | null;
  readonly development?: boolean | null;
  /** Время, начиная с которого признак включён везде. */
  readonly enableAt?: string | null;
}

export interface DecideOptions {
  readonly environment: ToggleEnvironment;
  readonly now?: Date;
}

/** Включён ли признак в этом окружении. */
export function isToggleOn(
  record: ToggleRecord | null | undefined,
  options: DecideOptions,
): boolean {
  if (!record) return false;

  const now = options.now ?? new Date();

  if (record.enableAt) {
    const at = new Date(record.enableAt).getTime();
    // Негодная дата решения не принимает: считаем, что времени не задавали,
    // иначе опечатка молча включила бы возможность всем.
    if (!Number.isNaN(at)) {
      if (now.getTime() >= at) return true;
      // Время назначено, но ещё не пришло: до него признак выключен, даже если
      // галочка окружения стоит. Иначе назначать время бессмысленно.
      return false;
    }
  }

  return byEnvironment(record, options.environment);
}

function byEnvironment(record: ToggleRecord, environment: ToggleEnvironment): boolean {
  if (environment === 'production') return record.production === true;
  if (environment === 'staging') return record.staging === true;
  return record.development === true;
}

/**
 * Где мы находимся.
 *
 * @remarks
 * Отдельная переменная, а не догадка по адресу сайта: пробная копия живёт на
 * своём домене, и угадывать по имени - способ однажды включить непроверенное
 * на рабочем сайте.
 */
export function currentEnvironment(value?: string | null): ToggleEnvironment {
  const raw = (value ?? '').toLowerCase();
  if (raw === 'production' || raw === 'prod') return 'production';
  if (raw === 'staging' || raw === 'stage') return 'staging';
  return 'development';
}

/** Свод «признак - включён» для всех, кого спросили: сайту удобнее одним куском. */
export function decideAll(
  records: ReadonlyArray<ToggleRecord>,
  options: DecideOptions,
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const record of records) out[record.key] = isToggleOn(record, options);
  return out;
}
