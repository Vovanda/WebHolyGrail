/**
 * Пункты блоков в меню вставки: какие идут в «+» и как ищутся в окне выбора.
 *
 * @remarks
 * Сами пункты строит редактор - у каждого блока набора есть готовый пункт
 * с подписью, значком и вставкой. Здесь только отбор и порядок, поэтому
 * функции не знают ни про редактор, ни про React и проверяются без них.
 */

/** Группа панели, в которую редактор складывает пункты блоков набора. */
export const BLOCKS_GROUP_KEY = 'blocks';

/** Редактор ключует пункт блока как `block-<имя блока>`. */
const BLOCK_KEY_PREFIX = 'block-';

/** Ключ пункта блока в меню редактора. */
export function blockItemKey(slug: string): string {
  return BLOCK_KEY_PREFIX + slug;
}

interface Keyed {
  readonly key: string;
}

/** Имя блока по ключу пункта; у чужих пунктов - `null`. */
export function blockSlugOf(key: string): string | null {
  return key.startsWith(BLOCK_KEY_PREFIX) ? key.slice(BLOCK_KEY_PREFIX.length) : null;
}

/**
 * Частые пункты в заданном порядке.
 *
 * @remarks
 * Имя из перечня, которого нет в наборе, пропускается: набор собирается
 * из блоков сайта, и частый блок мог из него уйти.
 */
export function pickFrequent<T extends Keyed>(
  items: readonly T[],
  frequent: readonly string[],
): T[] {
  const bySlug = new Map(items.map((item) => [blockSlugOf(item.key), item]));
  return frequent.flatMap((slug) => bySlug.get(slug) ?? []);
}

/** Весь набор для окна выбора: частые сверху, остальные в порядке набора. */
export function frequentFirst<T extends Keyed>(
  items: readonly T[],
  frequent: readonly string[],
): T[] {
  const head = pickFrequent(items, frequent);
  return [...head, ...items.filter((item) => !head.includes(item))];
}

interface LabelledBlock {
  readonly slug: string;
  readonly labels?: { readonly singular?: unknown; readonly plural?: unknown } | undefined;
}

/** Все строки подписи: строкой или по языкам. Подпись-функцию прочесть нельзя. */
function labelWords(label: unknown): string[] {
  if (typeof label === 'string') return [label];
  if (label && typeof label === 'object') {
    return Object.values(label).filter((word): word is string => typeof word === 'string');
  }
  return [];
}

/**
 * Слова, по которым в слэш-меню находится блок не из частых.
 *
 * @remarks
 * В слэш-меню стоят только частые блоки, остальные открываются окном. Чтобы
 * поиск «/таймлайн» не оставался пустым, подписи и имена остальных блоков
 * становятся словами пункта «Другие компоненты».
 */
export function blockSearchWords(
  blocks: readonly LabelledBlock[],
  frequent: readonly string[],
): string[] {
  const words = blocks
    .filter((block) => !frequent.includes(block.slug))
    .flatMap((block) => [
      block.slug,
      ...labelWords(block.labels?.singular),
      ...labelWords(block.labels?.plural),
    ]);
  return [...new Set(words)];
}

const fold = (text: string): string => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim();

/** Подходит ли подпись под строку поиска. Пустой поиск подходит всему. */
export function matchesQuery(label: string, query: string): boolean {
  const needle = fold(query);
  return needle === '' || fold(label).includes(needle);
}

/**
 * Подходит ли пункт окна под поиск: по подписи или по имени блока.
 *
 * @remarks
 * Имя блока - прежнее английское название (`banner-slider`, `quote`): кто
 * помнит блок по нему, находит его и после перевода подписей.
 */
export function pickerMatches(
  item: { readonly label: string; readonly key: string },
  query: string,
): boolean {
  const slug = blockSlugOf(item.key) ?? item.key;
  return matchesQuery(item.label, query) || matchesQuery(slug.replace(/[-_]/g, ' '), query);
}
