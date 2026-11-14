/**
 * Каталог: характеристики, фильтр по ним и поиск (docs/whg/44-catalog-search.md).
 *
 * @remarks
 * Характеристики - данные, их задаёт владелец у раздела каталога; новая
 * характеристика не требует ни кода, ни миграции. Всё здесь - чистые функции:
 * сайт и CMS спрашивают одни правила (R3), проверяются они без базы.
 */

/** Вид значения характеристики. */
export type SpecKind = 'enum' | 'number' | 'bool' | 'text';

/** Как характеристика показана в фильтре. */
export type FilterView = 'checks' | 'range' | 'hidden';

export interface Characteristic {
  /** Имя в адресе и в значениях позиции: латиница, цифры, дефис. */
  readonly key: string;
  readonly title: string;
  readonly unit?: string | null | undefined;
  readonly kind: SpecKind;
  /** Группа в панели фильтра: «Основные», «Размеры». */
  readonly group?: string | null | undefined;
  readonly filter: FilterView;
  /** Показывать ли в карточке позиции; пусто - показывать. */
  readonly inCard?: boolean | null | undefined;
  /** Значения - строкой быстрых фильтров над плиткой; у да/нет - один переключатель. */
  readonly quick?: boolean | null | undefined;
}

export type SpecValue = string | number | boolean | null;

/** Позиция глазами каталога: что ищется и по чему фильтруется. */
export interface CatalogItem {
  readonly id: number;
  readonly title: string;
  readonly sku?: string | null | undefined;
  /** Другие названия от продавца, необязательно: «роутер» у «маршрутизатора». */
  readonly keywords?: string | null | undefined;
  readonly section?: string | null | undefined;
  /** Название раздела - для поиска: покупатель пишет «перфоратор», а не слаг раздела. */
  readonly sectionTitle?: string | null | undefined;
  readonly summary?: string | null | undefined;
  readonly specs: Readonly<Record<string, SpecValue>>;
}

/** Выбор по одной характеристике: значения перечня или границы диапазона. */
export interface Selection {
  readonly values?: readonly string[];
  readonly min?: number;
  readonly max?: number;
}

export type FilterState = Readonly<Record<string, Selection>>;

const KEY = /^[a-z0-9-]{1,32}$/;

/**
 * Характеристики магазина, общие для всех разделов: значения берутся из полей
 * позиции, а не из набора раздела.
 *
 * @remarks
 * Так наличие, скидка и цена фильтруются тем же движком, что и характеристики
 * раздела: одна панель, один адрес, одни счётчики - и на `/shop`, где своих
 * характеристик нет, и в любом разделе. Ключи заняты: характеристика раздела
 * с таким ключом отбрасывается.
 */
export const SHOP_CHARACTERISTICS: readonly Characteristic[] = [
  {
    key: 'in-stock',
    title: 'В наличии',
    unit: null,
    kind: 'bool',
    group: null,
    filter: 'checks',
    quick: true,
    inCard: false,
  },
  {
    key: 'sale',
    title: 'Со скидкой',
    unit: null,
    kind: 'bool',
    group: null,
    filter: 'checks',
    quick: true,
    inCard: false,
  },
  {
    key: 'price',
    title: 'Цена',
    unit: null,
    kind: 'number',
    group: null,
    filter: 'range',
    inCard: false,
  },
];

const RESERVED = new Set(SHOP_CHARACTERISTICS.map((c) => c.key));

/** Характеристики выдачи: общие для магазина, затем раздела. */
export const withShopCharacteristics = (section: readonly Characteristic[]): Characteristic[] => [
  ...SHOP_CHARACTERISTICS,
  ...section,
];

/** Адрес позиции или раздела в ссылке: латиница в нижнем регистре, цифры и дефис, до 120 знаков. */
export function isSlug(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9-]{1,120}$/.test(value);
}
const MAX_VALUES = 20;

const KINDS: readonly SpecKind[] = ['enum', 'number', 'bool', 'text'];
const VIEWS: readonly FilterView[] = ['checks', 'range', 'hidden'];

/**
 * Характеристики раздела из админки: годные, без повторов ключа.
 *
 * @remarks
 * Владелец заводит их руками, поэтому разбор терпит пустое и неполное: строка
 * без ключа или названия пропускается, неизвестный вид становится текстом,
 * неизвестный вид фильтра - галочками у перечня и диапазоном у числа.
 */
export function cleanCharacteristics(raw: unknown): Characteristic[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: Characteristic[] = [];
  for (const item of raw as Record<string, unknown>[]) {
    const key = typeof item?.['key'] === 'string' ? item['key'].trim() : '';
    const title = typeof item?.['title'] === 'string' ? item['title'].trim() : '';
    if (!KEY.test(key) || !title || seen.has(key) || RESERVED.has(key)) continue;
    seen.add(key);
    const kind = KINDS.includes(item['kind'] as SpecKind) ? (item['kind'] as SpecKind) : 'text';
    const filter = VIEWS.includes(item['filter'] as FilterView)
      ? (item['filter'] as FilterView)
      : kind === 'number'
        ? 'range'
        : kind === 'text'
          ? 'hidden'
          : 'checks';
    const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    out.push({
      key,
      title,
      unit: text(item['unit']),
      kind,
      group: text(item['group']),
      filter,
      inCard: item['inCard'] !== false,
      quick: item['quick'] === true,
    });
  }
  return out;
}

/** Строки характеристик для карточки позиции: по порядку раздела, только заполненные. */
export function cardSpecs(
  characteristics: readonly Characteristic[],
  specs: Readonly<Record<string, SpecValue>>,
): { readonly key: string; readonly title: string; readonly value: string }[] {
  return characteristics.flatMap((c) => {
    const text = c.inCard === false ? null : specText(specs[c.key]);
    return text === null
      ? []
      : [{ key: c.key, title: c.title, value: c.unit ? `${text} ${c.unit}` : text }];
  });
}

/**
 * Характеристики, которые позиция отдаёт наружу: ключи своего раздела, видимые в карточке или
 * в фильтре. Значения от прежнего раздела и скрытые везде владельцем на сайт не уходят.
 */
export function publicSpecs(
  characteristics: readonly Characteristic[],
  specs: Readonly<Record<string, SpecValue>>,
): Record<string, SpecValue> {
  return Object.fromEntries(
    characteristics
      .filter((c) => (c.inCard !== false || c.filter !== 'hidden') && c.key in specs)
      .map((c) => [c.key, specs[c.key]!]),
  );
}

/** Сколько позиций в ряду «Похожие» и «С этим часто берут» на странице позиции. */
export const RELATED_LIMIT = 4;

/**
 * Похожие позиции: тот же раздел, сначала те, что есть в наличии, затем больше совпавших
 * значений характеристик и ближе цена.
 *
 * @remarks
 * Ряд нужен, чтобы купить, поэтому закончившиеся идут в конец. Сама позиция и позиции
 * без цены в ряд не попадают. Близость цены - разница в долях от цены позиции.
 */
export function similarItems<
  T extends CatalogItem & { readonly price: number | null; readonly stock?: number | null },
>(target: T, candidates: readonly T[], limit = RELATED_LIMIT): T[] {
  const same = (a: SpecValue | undefined, b: SpecValue | undefined) =>
    a !== undefined && a !== null && a !== '' && a === b;
  const gap = (p: number | null) =>
    p === null || target.price === null || target.price <= 0
      ? Number.POSITIVE_INFINITY
      : Math.abs(p - target.price) / target.price;
  return candidates
    .filter(
      (c) => c.id !== target.id && c.section === target.section && c.price !== null && c.price > 0,
    )
    .map((c) => ({
      c,
      gone: typeof c.stock === 'number' && c.stock <= 0 ? 1 : 0,
      matches: Object.keys(target.specs).filter((k) => same(target.specs[k], c.specs[k])).length,
      gap: gap(c.price),
    }))
    .sort((a, b) => a.gone - b.gone || b.matches - a.matches || a.gap - b.gap || a.c.id - b.c.id)
    .slice(0, limit)
    .map((x) => x.c);
}

/** Характеристики, которые видны хоть где-то: скрытые везде наружу не отдаются даже названием. */
export const visibleCharacteristics = (chars: readonly Characteristic[]): Characteristic[] =>
  chars.filter((c) => c.inCard !== false || c.filter !== 'hidden');

/** Значение характеристики позиции строкой - так оно стоит в адресе и в фасете. */
export function specText(value: SpecValue | undefined): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'да' : 'нет';
  return String(value);
}

const asNumber = (value: SpecValue | undefined): number | null => {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').replace(',', '.'));
  return value === null || value === undefined || value === '' || !Number.isFinite(n) ? null : n;
};

const parseBound = (s: string): number | undefined => {
  if (!s) return undefined;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) ? n : undefined;
};

/**
 * Фильтр из параметров адреса (R13).
 *
 * @remarks
 * Перечень - значения через запятую: `?material=pvc,tpo`; диапазон - через две
 * точки, любая граница может отсутствовать: `?thickness=1.2..2`. Чужие ключи,
 * скрытые характеристики и мусор отбрасываются: адрес пишет кто угодно.
 */
export function readFilter(
  params: Readonly<Record<string, string | readonly string[] | undefined>>,
  characteristics: readonly Characteristic[],
): FilterState {
  const state: Record<string, Selection> = {};
  for (const c of characteristics) {
    if (c.filter === 'hidden' || !KEY.test(c.key)) continue;
    const raw = params[c.key];
    const text = (Array.isArray(raw) ? raw[0] : raw) as string | undefined;
    if (!text) continue;
    if (c.filter === 'range') {
      const [lo = '', hi = ''] = text.slice(0, 64).split('..');
      const min = parseBound(lo);
      const max = parseBound(hi);
      if (min !== undefined || max !== undefined)
        state[c.key] = {
          ...(min === undefined ? {} : { min }),
          ...(max === undefined ? {} : { max }),
        };
      continue;
    }
    const values = [
      ...new Set(
        text
          .split(',')
          .map((v) => v.trim().slice(0, 64))
          .filter(Boolean),
      ),
    ].slice(0, MAX_VALUES);
    if (values.length > 0) state[c.key] = { values };
  }
  return state;
}

/** Фильтр в строку адреса: порядок - порядок характеристик, чтобы ссылки совпадали. */
export function writeFilter(
  state: FilterState,
  characteristics: readonly Characteristic[],
): string {
  const query = new URLSearchParams();
  for (const c of characteristics) {
    const s = state[c.key];
    if (!s) continue;
    if (s.values && s.values.length > 0) query.set(c.key, s.values.join(','));
    else if (s.min !== undefined || s.max !== undefined)
      query.set(c.key, `${s.min ?? ''}..${s.max ?? ''}`);
  }
  return query.toString();
}

/** Переключить значение перечня: выбранное снимается, новое добавляется. */
export function toggleValue(state: FilterState, key: string, value: string): FilterState {
  const current = state[key]?.values ?? [];
  const values = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
  const next: Record<string, Selection> = { ...state };
  if (values.length > 0) next[key] = { values };
  else delete next[key];
  return next;
}

function matchesOne(item: CatalogItem, c: Characteristic, s: Selection): boolean {
  const value = item.specs[c.key];
  if (s.values) {
    const text = specText(value);
    return text !== null && s.values.includes(text);
  }
  const n = asNumber(value);
  if (n === null) return false;
  return (s.min === undefined || n >= s.min) && (s.max === undefined || n <= s.max);
}

/** Позиции, подходящие под все выбранные условия, кроме `except` (для счётчиков). */
export function applyFilter<T extends CatalogItem>(
  items: readonly T[],
  state: FilterState,
  characteristics: readonly Characteristic[],
  except?: string,
): T[] {
  const active = characteristics.filter((c) => c.key !== except && state[c.key]);
  return items.filter((item) => active.every((c) => matchesOne(item, c, state[c.key]!)));
}

export interface FacetOption {
  readonly value: string;
  readonly count: number;
  readonly selected: boolean;
}

export type Facet =
  | {
      readonly key: string;
      readonly kind: SpecKind;
      readonly title: string;
      readonly unit: string | null;
      readonly group: string | null;
      readonly view: 'checks';
      readonly options: readonly FacetOption[];
    }
  | {
      readonly key: string;
      readonly kind: SpecKind;
      readonly title: string;
      readonly unit: string | null;
      readonly group: string | null;
      readonly view: 'range';
      /** Границы среди позиций, подходящих под остальные условия. */
      readonly bounds: { readonly min: number; readonly max: number };
      readonly selected: { readonly min?: number; readonly max?: number };
    };

/**
 * Фасеты раздела.
 *
 * @remarks
 * Значения собираются из самих позиций: в фильтре только то, что можно выбрать.
 * Счётчик значения считается при остальных выбранных условиях, без условия своей
 * характеристики - иначе у выбранной осталось бы одно значение. Значение с нулём
 * остаётся видно, сайт показывает его приглушённым. Характеристика, у которой в
 * разделе меньше двух значений, в фильтр не попадает: выбирать нечего.
 */
export function facetsOf(
  items: readonly CatalogItem[],
  state: FilterState,
  characteristics: readonly Characteristic[],
): Facet[] {
  const shown = characteristics.filter((c) => c.filter !== 'hidden');
  const active = characteristics.filter((c) => state[c.key]);

  /*
    Один проход по позициям. Счётчик характеристики считается при остальных
    условиях, без её собственного: позиция, не прошедшая ни одного условия,
    идёт в счёт всех характеристик, не прошедшая ровно одно - только в счёт
    этого одного. Раньше пул фильтровался заново на каждую характеристику
    и на каждое значение, и на десяти тысячах позиций это и было время ответа.
  */
  const counts = new Map(shown.map((c) => [c.key, new Map<string, number>()]));
  const values = new Map(shown.map((c) => [c.key, new Set<string>()]));
  const spans = new Map(
    shown.map((c) => [
      c.key,
      {
        all: { min: Infinity, max: -Infinity, n: 0 },
        pool: { min: Infinity, max: -Infinity, n: 0 },
        distinct: new Set<number>(),
      },
    ]),
  );
  for (const item of items) {
    let fails = 0;
    let failed = '';
    for (const c of active) {
      if (matchesOne(item, c, state[c.key]!)) continue;
      fails += 1;
      failed = c.key;
      if (fails > 1) break;
    }
    for (const c of shown) {
      const counted = fails === 0 || (fails === 1 && failed === c.key);
      if (c.filter === 'range') {
        const n = asNumber(item.specs[c.key]);
        if (n === null) continue;
        const span = spans.get(c.key)!;
        if (span.distinct.size < 2) span.distinct.add(n);
        span.all.min = Math.min(span.all.min, n);
        span.all.max = Math.max(span.all.max, n);
        span.all.n += 1;
        if (counted) {
          span.pool.min = Math.min(span.pool.min, n);
          span.pool.max = Math.max(span.pool.max, n);
          span.pool.n += 1;
        }
        continue;
      }
      const text = specText(item.specs[c.key]);
      if (text === null) continue;
      values.get(c.key)!.add(text);
      if (counted) {
        const map = counts.get(c.key)!;
        map.set(text, (map.get(text) ?? 0) + 1);
      }
    }
  }

  const facets: Facet[] = [];
  for (const c of shown) {
    const head = {
      key: c.key,
      kind: c.kind,
      title: c.title,
      unit: c.unit ?? null,
      group: c.group ?? null,
    };
    if (c.filter === 'range') {
      const span = spans.get(c.key)!;
      if (span.distinct.size < 2) continue;
      const from = span.pool.n > 0 ? span.pool : span.all;
      const s = state[c.key] ?? {};
      facets.push({
        ...head,
        view: 'range',
        bounds: { min: from.min, max: from.max },
        selected: {
          ...(s.min === undefined ? {} : { min: s.min }),
          ...(s.max === undefined ? {} : { max: s.max }),
        },
      });
      continue;
    }
    const all = [...values.get(c.key)!];
    if (all.length < 2) continue;
    const chosen = state[c.key]?.values ?? [];
    const numeric = c.kind === 'number';
    const map = counts.get(c.key)!;
    facets.push({
      ...head,
      view: 'checks',
      options: all
        .sort((a, b) => (numeric ? Number(a) - Number(b) : a.localeCompare(b, 'ru')))
        .map((value) => ({ value, count: map.get(value) ?? 0, selected: chosen.includes(value) })),
    });
  }
  return facets;
}

/* ──────────────────────── Сортировка и страницы ──────────────────────── */

/** Порядок выдачи; ключ стоит в адресе `?sort=`. */
export type SortKey = 'default' | 'price-asc' | 'price-desc' | 'discount' | 'new';

export const SORTS: readonly { readonly key: SortKey; readonly title: string }[] = [
  { key: 'default', title: 'По умолчанию' },
  { key: 'price-asc', title: 'Сначала дешевле' },
  { key: 'price-desc', title: 'Сначала дороже' },
  { key: 'discount', title: 'По размеру скидки' },
  { key: 'new', title: 'Новинки' },
];

/** Сколько позиций на странице выдачи. */
export const PAGE_SIZE = 30;

/** Порядок из адреса; чужое значение - «по умолчанию». */
export function readSort(raw: string | readonly string[] | undefined): SortKey {
  const text = Array.isArray(raw) ? raw[0] : raw;
  return SORTS.some((s) => s.key === text) ? (text as SortKey) : 'default';
}

/** Номер страницы из адреса: целое от 1, мусор - первая. */
export function readPage(raw: string | readonly string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

/** Чем сортировать: значения берёт тот, кто знает позицию. */
export interface SortKeys<T> {
  readonly price: (item: T) => number | null;
  readonly discount: (item: T) => number;
  readonly created: (item: T) => string;
}

/**
 * Позиции в заданном порядке.
 *
 * @remarks
 * «По умолчанию» оставляет порядок входа - его задаёт хранилище, как в списке
 * админки, а при запросе поиска - релевантность. Позиция без цены при сортировке
 * по цене уходит в конец в обе стороны: «цена по запросу» не дешевле и не дороже.
 * Сортировка устойчивая: равные остаются в порядке входа.
 */
export function sortItems<T>(items: readonly T[], sort: SortKey, keys: SortKeys<T>): T[] {
  if (sort === 'default') return [...items];
  const order = items.map((item, at) => ({ item, at }));
  const byPrice = (dir: 1 | -1) => (a: { item: T; at: number }, b: { item: T; at: number }) => {
    const pa = keys.price(a.item);
    const pb = keys.price(b.item);
    if (pa === null || pb === null) return pa === pb ? a.at - b.at : pa === null ? 1 : -1;
    return (pa - pb) * dir || a.at - b.at;
  };
  const compare =
    sort === 'price-asc'
      ? byPrice(1)
      : sort === 'price-desc'
        ? byPrice(-1)
        : sort === 'discount'
          ? (a: { item: T; at: number }, b: { item: T; at: number }) =>
              keys.discount(b.item) - keys.discount(a.item) || a.at - b.at
          : (a: { item: T; at: number }, b: { item: T; at: number }) =>
              keys.created(b.item).localeCompare(keys.created(a.item)) || a.at - b.at;
  return order.sort(compare).map((o) => o.item);
}

/** Страница выдачи: какие позиции и сколько всего. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pages: number;
  readonly total: number;
}

/** Срез страницы; номер за последней страницей прижимается к последней. */
export function pageOf<T>(items: readonly T[], page: number, size = PAGE_SIZE): Page<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const at = Math.min(Math.max(1, page), pages);
  return { items: items.slice((at - 1) * size, at * size), page: at, pages, total: items.length };
}

/* ───────────────────────── Поиск ───────────────────────── */

/** Нижний регистр, ё → е, один пробел между словами. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
}

const EN = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`";
const RU = 'йцукенгшщзхъфывапролджэячсмитьбюё';

/** Запрос, набранный не в той раскладке: «fqajy» → «айфон», «ршзрщту» → «iphone». */
export function switchLayout(s: string): string {
  return [...s]
    .map((ch) => {
      const en = EN.indexOf(ch);
      if (en >= 0) return RU[en]!;
      const ru = RU.indexOf(ch);
      return ru >= 0 ? EN[ru]! : ch;
    })
    .join('');
}

/**
 * Сколько опечаток прощается слову: до 4 букв - ни одной, до 8 - одна, длиннее - две.
 * Это умолчания Meilisearch (`minWordSizeForTypos` 5 и 9): при переезде на него выдача
 * не изменится.
 */
export function typoBudget(word: string): number {
  return word.length < 5 ? 0 : word.length < 9 ? 1 : 2;
}

/** Расстояние с перестановкой соседних букв, не дальше `limit` (дальше - `limit + 1`). */
export function editDistance(a: string, b: string, limit: number): number {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  /*
    Три ряда вместо матрицы и без выделения памяти на каждое сравнение: поиск
    сверяет слово запроса с тысячами слов каталога, и выделение было дороже
    самого счёта. Перестановка соседних букв считается одной правкой.
  */
  const width = b.length + 1;
  if (rows[0]!.length < width) for (let r = 0; r < 3; r += 1) rows[r] = new Int32Array(width * 2);
  let back = rows[0]!;
  let prev = rows[1]!;
  let cur = rows[2]!;
  for (let j = 0; j < width; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    cur[0] = i;
    let rowMin = cur[0]!;
    for (let j = 1; j < width; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      if (
        i > 1 &&
        j > 1 &&
        a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
      )
        v = Math.min(v, back[j - 2]! + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > limit) return limit + 1;
    const spare = back;
    back = prev;
    prev = cur;
    cur = spare;
  }
  return Math.min(prev[b.length]!, limit + 1);
}

/** Ряды для `editDistance`, общие на все вызовы: поиск однопоточный. */
const rows: Int32Array[] = [new Int32Array(64), new Int32Array(64), new Int32Array(64)];

/** Слово из одних цифр: с буквенным словом запроса совпасть может только по началу. */
const DIGITS = /^\d+$/;

/** Подходит ли слово запроса к слову текста: по началу или с допуском опечатки. */
function wordMatches(word: string, token: string): boolean {
  if (token.startsWith(word)) return true;
  // В артикуле и модели одна цифра - другой товар: слова с цифрами без допуска.
  if (/\d/.test(word)) return false;
  const budget = typoBudget(word);
  if (budget === 0 || DIGITS.test(token)) return false;
  return (
    editDistance(word, token, budget) <= budget ||
    (token.length > word.length &&
      editDistance(word, token.slice(0, word.length), budget) <= budget)
  );
}

/** Где ищет и с каким весом: название и другие названия, артикул, раздел, характеристики, описание. */
const FIELDS: readonly [(i: CatalogItem) => string, number][] = [
  [(i) => i.title, 5],
  [(i) => i.keywords ?? '', 5],
  [(i) => i.sku ?? '', 4],
  [(i) => i.sectionTitle ?? '', 3],
  [
    (i) =>
      Object.values(i.specs)
        .map((v) => specText(v) ?? '')
        .join(' '),
    2,
  ],
  [(i) => i.summary ?? '', 1],
];

/** Слова текста: между ними всё, что не буква и не цифра. */
const wordsOf = (s: string): string[] =>
  normalize(s)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/**
 * Падежные и числовые окончания, от длинных к коротким. Отсекаются у слова
 * запроса, дальше слово ищется по началу: «перфораторы» находит «перфоратор»,
 * «дрели» - «дрель». Морфологии тут нет и не нужно: каталогу хватает основы.
 */
const ENDINGS = [
  'ами',
  'ями',
  'ого',
  'его',
  'ому',
  'ему',
  'ыми',
  'ими',
  'ов',
  'ев',
  'ей',
  'ам',
  'ям',
  'ах',
  'ях',
  'ой',
  'ый',
  'ий',
  'ая',
  'яя',
  'ое',
  'ее',
  'ые',
  'ие',
  'ых',
  'их',
  'ую',
  'юю',
  'ы',
  'и',
  'а',
  'я',
  'у',
  'ю',
  'е',
  'о',
];

/** Основа слова запроса: окончание отсекается у слов от шести букв, основа - от четырёх. */
export function stemWord(word: string): string {
  if (word.length < 6 || /\d/.test(word)) return word;
  for (const ending of ENDINGS) {
    if (word.endsWith(ending) && word.length - ending.length >= 4) {
      return word.slice(0, -ending.length);
    }
  }
  return word;
}

/** Чем можно заменить слово запроса: оно само и его основа. */
function variantsOf(word: string): string[] {
  const stem = stemWord(word);
  return stem === word ? [word] : [word, stem];
}

/** Поиск по набору позиций: индекс строится на набор один раз (`searchIndex`). */
export function searchItems<T extends CatalogItem>(items: readonly T[], query: string): T[] {
  return searchIn(searchIndex(items), query);
}

/** Сколько последних запросов помнит индекс: подсказки повторяют их при наборе. */
const REMEMBERED = 200;

/**
 * Обратный индекс поиска: каждое слово каталога - позиции, где оно стоит,
 * с весом самого важного поля.
 *
 * @remarks
 * Запрос сверяется с уникальными словами каталога, а не со словами каждой
 * позиции: слов в разы меньше, чем позиций с их словами, и проверка опечатки
 * (самое дорогое) идёт по ним. У короткого поля (артикул «TT-1000») в индекс
 * ложится и слитное написание. Индекс строится один раз на набор позиций -
 * индекс каталога держит его, пока данные не изменились.
 */
export interface SearchIndex<T extends CatalogItem> {
  readonly items: readonly T[];
  readonly words: ReadonlyMap<string, ReadonlyMap<number, number>>;
  readonly remembered: Map<string, readonly T[]>;
}

const indexes = new WeakMap<readonly CatalogItem[], SearchIndex<CatalogItem>>();

export function searchIndex<T extends CatalogItem>(items: readonly T[]): SearchIndex<T> {
  const cached = indexes.get(items);
  if (cached) return cached as SearchIndex<T>;
  const words = new Map<string, Map<number, number>>();
  items.forEach((item, at) => {
    for (const [field, weight] of FIELDS) {
      const found = wordsOf(field(item));
      const all = found.length > 1 && found.length <= 4 ? [...found, found.join('')] : found;
      for (const word of all) {
        let postings = words.get(word);
        if (!postings) words.set(word, (postings = new Map()));
        if ((postings.get(at) ?? 0) < weight) postings.set(at, weight);
      }
    }
  });
  const index: SearchIndex<T> = { items, words, remembered: new Map() };
  indexes.set(items, index as SearchIndex<CatalogItem>);
  return index;
}

/**
 * Поиск по индексу.
 *
 * @remarks
 * Каждое слово запроса должно найтись хоть где-то; выше те, у кого совпало в
 * более важном поле. Пустая выдача в своей раскладке - пробуется другая: человек
 * набрал «fqajy», имея в виду «айфон». Слово запроса ищется вместе с основой
 * (без окончания). Ищется по тому, что продавец и так заводит: название, артикул,
 * раздел, характеристики; другие названия товара («роутер» у «маршрутизатора»)
 * продавец может дописать в позиции, но без них поиск работает так же.
 */
export function searchIn<T extends CatalogItem>(index: SearchIndex<T>, query: string): T[] {
  const key = normalize(query);
  const hit = index.remembered.get(key);
  if (hit) return [...hit];

  const run = (q: string): T[] => {
    const words = wordsOf(q).slice(0, 8).map(variantsOf);
    if (words.length === 0) return [...index.items];
    let scores: Map<number, number> | null = null;
    for (const variants of words) {
      const best = new Map<number, number>();
      for (const [token, postings] of index.words) {
        if (!variants.some((word) => wordMatches(word, token))) continue;
        for (const [at, weight] of postings) {
          if ((best.get(at) ?? 0) < weight) best.set(at, weight);
        }
      }
      const prev: Map<number, number> | null = scores;
      const next = new Map<number, number>();
      for (const [at, weight] of best) {
        if (prev === null) next.set(at, weight);
        else if (prev.has(at)) next.set(at, prev.get(at)! + weight);
      }
      scores = next;
      if (scores.size === 0) return [];
    }
    return [...scores!].sort((a, b) => b[1] - a[1] || a[0] - b[0]).map(([at]) => index.items[at]!);
  };

  const direct = run(query);
  const found = direct.length > 0 || !key ? direct : run(switchLayout(key));
  if (index.remembered.size >= REMEMBERED) {
    index.remembered.delete(index.remembered.keys().next().value!);
  }
  index.remembered.set(key, found);
  return [...found];
}
