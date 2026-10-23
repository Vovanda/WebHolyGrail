/**
 * Модули движка: что включается и выключается одним переключателем.
 *
 * Порядок - порядок разделов в меню админки и плиток на вкладке «Модули»:
 * сперва входящее от посетителя, потом содержимое, служебное ниже.
 *
 * @remarks
 * Модуль - набор коллекций и блоков, нужный не каждому сайту: блог, каталог
 * специалистов, соцсети, формы, магазин. «Контент» и «Медиа» есть у любого
 * сайта и в реестр не входят - они не выключаются.
 *
 * Реестр лежит в contracts: по нему CMS прячет разделы админки и закрывает API,
 * а сайт решает, рисовать ли блок, - правило одно на обе стороны (R3).
 *
 * Включённость хранится системным переключателем `module.<ключ>` в
 * `feature-toggles`, как любой другой флаг: владелец меняет её без выкладки
 * (docs/whg/45-data-location.md).
 */
export interface EngineModule {
  readonly key: ModuleKey;
  /** Подпись плитки на странице «Модули». */
  readonly title: string;
  readonly description: string;
  readonly collections: readonly string[];
  readonly blocks: readonly string[];
}

export const MODULES = [
  {
    key: 'forms',
    title: 'Формы',
    description: 'Формы сайта и присланные через них ответы; блок формы.',
    collections: ['form-submissions'],
    blocks: ['request-form'],
  },
  {
    key: 'shop',
    title: 'Магазин',
    description: 'Позиции, заказы и счета; блоки витрины и корзины.',
    collections: ['offers', 'orders', 'invoices'],
    blocks: ['shop-showcase', 'shop-cart'],
  },
  {
    key: 'blog',
    title: 'Блог',
    description: 'Статьи, треды, теги и авторы; блоки лент статей и тредов.',
    collections: ['articles', 'threads', 'tags', 'authors'],
    blocks: ['articles-section', 'threads-section'],
  },
  {
    // Доступы - своя категория, не часть медиа: закрытой бывает любая запись.
    // Выключенный модуль прячет управление доступами, а закрытое остаётся
    // закрытым: проверка доступа идёт в обход переключателя.
    key: 'access',
    title: 'Доступы',
    description: 'Права, коды доступа и ссылки-приглашения к закрытым записям.',
    collections: [
      'media-accesses',
      'media-access-rights',
      'media-access-codes',
      'media-access-links',
    ],
    blocks: [],
  },
  {
    key: 'specialists',
    title: 'Специалисты',
    description: 'Каталог людей по городам: тренеры, мастера, врачи, репетиторы.',
    collections: ['cities', 'specialists'],
    blocks: ['specialist-directory', 'specialist-profile'],
  },
  {
    key: 'social',
    title: 'Соцсети',
    description: 'Посты и комментарии из соцсетей и блок ленты.',
    collections: ['social-posts', 'comments'],
    blocks: ['social-feed'],
  },
] as const satisfies readonly {
  key: string;
  title: string;
  description: string;
  collections: readonly string[];
  blocks: readonly string[];
}[];

export type ModuleKey = (typeof MODULES)[number]['key'];

/** Ключ переключателя модуля в `feature-toggles`. */
export const moduleToggleKey = (key: ModuleKey): string => `module.${key}`;

/** Модуль, которому принадлежит коллекция; коллекции «Контента» и «Медиа» - null. */
export function moduleOfCollection(slug: string): ModuleKey | null {
  return MODULES.find((m) => (m.collections as readonly string[]).includes(slug))?.key ?? null;
}

/** Модуль, которому принадлежит блок; блоки без модуля - null. */
export function moduleOfBlock(slug: string): ModuleKey | null {
  return MODULES.find((m) => (m.blocks as readonly string[]).includes(slug))?.key ?? null;
}

/**
 * Включён ли модуль по значениям переключателей.
 *
 * @remarks
 * Записи переключателя нет - модуль включён: сайт, собранный до модулей, после
 * обновления не теряет ни одного раздела (R10). Выключенными опциональные модули
 * приходят только к новому сайту - их заводит стартовое наполнение.
 */
export function isModuleEnabled(
  toggles: Readonly<Record<string, boolean | undefined>>,
  key: ModuleKey | null,
): boolean {
  if (key === null) return true;
  return toggles[moduleToggleKey(key)] ?? true;
}

/** Блоки, которые нельзя ставить на страницу: блоки выключенных модулей. */
export function disabledBlocks(toggles: Readonly<Record<string, boolean | undefined>>): string[] {
  return MODULES.filter((m) => !isModuleEnabled(toggles, m.key)).flatMap((m) => [...m.blocks]);
}
