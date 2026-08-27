/**
 * Переключатели, приходящие из хранилища секретов.
 *
 * @remarks
 * Часть признаков заводит не владелец сайта, а тот, кто занимается серверами:
 * ограничения, пороги, обходные пути на время неполадок. Такие значения живут
 * в Infisical рядом с остальными настройками окружения и попадают в сайт
 * переменными.
 *
 * Значение из хранилища главнее галочек в админке: если признаком управляют
 * снаружи, галочка не должна тихо его переопределять. Зато сам признак виден в
 * общем списке, поэтому владелец не гадает, откуда взялось поведение.
 *
 * Непонятное значение не принимается, и признак остаётся на галочках. Опечатка
 * в переменной иначе погасила бы работающую возможность.
 */

/** Приставка, по которой переменная опознаётся как переключатель. */
const PREFIX = 'TOGGLE_';

const YES = new Set(['1', 'true', 'on', 'yes']);
const NO = new Set(['0', 'false', 'off', 'no']);

/** Имя переменной для признака: `video.layout.vendor` - `TOGGLE_VIDEO_LAYOUT_VENDOR`. */
export function envNameFor(key: string): string {
  return PREFIX + key.replace(/\./g, '_').toUpperCase();
}

/** Признак по имени переменной, или `null`, если это не переключатель. */
export function keyFromEnvName(name: string): string | null {
  if (!name.startsWith(PREFIX)) return null;
  const rest = name.slice(PREFIX.length);
  if (!rest) return null;
  return rest.toLowerCase().replace(/_/g, '.');
}

/** Что из переменных окружения относится к переключателям. */
export function readEnvToggles(env: Record<string, string | undefined>): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const [name, raw] of Object.entries(env)) {
    const key = keyFromEnvName(name);
    if (!key || typeof raw !== 'string') continue;

    const value = raw.trim().toLowerCase();
    if (YES.has(value)) result[key] = true;
    else if (NO.has(value)) result[key] = false;
  }

  return result;
}
