/**
 * Адрес раздела каталога людей.
 *
 * @remarks
 * Сегмент вынесен в переменную окружения, потому что называется он у каждого
 * сайта по-своему: «эксперты» в сообществе тренеров, «врачи» в клинике,
 * «мастера» в студии. Пока сегмент был зашит в generic-компоненты, инстанс мог
 * переименовать раздел только правкой этих компонентов — и каждый следующий
 * синк шаблона возвращал старые ссылки, а карточки начинали вести в никуда.
 *
 * Значение задаётся `NEXT_PUBLIC_CATALOG_SEGMENT` (без слэшей). Не задано —
 * остаётся `specialists`, как в шаблоне.
 */
const RAW = process.env['NEXT_PUBLIC_CATALOG_SEGMENT']?.trim().replace(/^\/+|\/+$/g, '');

/** Сегмент раздела: `experts`, `doctors`, `specialists`. */
export const CATALOG_SEGMENT = RAW && /^[a-z0-9-]+$/.test(RAW) ? RAW : 'specialists';

/** Адрес каталога целиком или карточки внутри него. */
export function catalogPath(slug?: string): string {
  return slug ? `/${CATALOG_SEGMENT}/${slug}` : `/${CATALOG_SEGMENT}`;
}

/** Сегмент отличается от шаблонного — значит роуты шаблона должны увести на него. */
export const CATALOG_RENAMED = CATALOG_SEGMENT !== 'specialists';
