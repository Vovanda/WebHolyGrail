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
}

export type SpecValue = string | number | boolean | null;

/** Позиция глазами каталога: что ищется и по чему фильтруется. */
export interface CatalogItem {
  readonly id: number;
  readonly title: string;
  readonly sku?: string | null | undefined;
  readonly section?: string | null | undefined;
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
    if (!KEY.test(key) || !title || seen.has(key)) continue;
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
      readonly title: string;
      readonly unit: string | null;
      readonly group: string | null;
      readonly view: 'checks';
      readonly options: readonly FacetOption[];
    }
  | {
      readonly key: string;
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
  const facets: Facet[] = [];
  for (const c of characteristics) {
    if (c.filter === 'hidden') continue;
    const head = {
      key: c.key,
      title: c.title,
      unit: c.unit ?? null,
      group: c.group ?? null,
    };
    if (c.filter === 'range') {
      const numbers = items.map((i) => asNumber(i.specs[c.key])).filter((n) => n !== null);
      const distinct = new Set(numbers);
      if (distinct.size < 2) continue;
      const pool = applyFilter(items, state, characteristics, c.key)
        .map((i) => asNumber(i.specs[c.key]))
        .filter((n) => n !== null);
      const from = pool.length > 0 ? pool : numbers;
      const s = state[c.key] ?? {};
      facets.push({
        ...head,
        view: 'range',
        bounds: { min: Math.min(...from), max: Math.max(...from) },
        selected: {
          ...(s.min === undefined ? {} : { min: s.min }),
          ...(s.max === undefined ? {} : { max: s.max }),
        },
      });
      continue;
    }
    const all = [...new Set(items.map((i) => specText(i.specs[c.key])).filter((v) => v !== null))];
    if (all.length < 2) continue;
    const pool = applyFilter(items, state, characteristics, c.key);
    const chosen = state[c.key]?.values ?? [];
    const numeric = c.kind === 'number';
    facets.push({
      ...head,
      view: 'checks',
      options: all
        .sort((a, b) => (numeric ? Number(a) - Number(b) : a.localeCompare(b, 'ru')))
        .map((value) => ({
          value,
          count: pool.filter((i) => specText(i.specs[c.key]) === value).length,
          selected: chosen.includes(value),
        })),
    });
  }
  return facets;
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
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i += 1) {
    let rowMin = Infinity;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
        v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > limit) return limit + 1;
  }
  return Math.min(d[a.length]![b.length]!, limit + 1);
}

/** Подходит ли слово запроса к слову текста: по началу или с допуском опечатки. */
function wordMatches(word: string, token: string): boolean {
  if (token.startsWith(word)) return true;
  const budget = typoBudget(word);
  if (budget === 0) return false;
  return (
    editDistance(word, token, budget) <= budget ||
    editDistance(word, token.slice(0, word.length), budget) <= budget
  );
}

/** Где ищет и с каким весом: название, артикул, раздел, характеристики, описание. */
const FIELDS: readonly [(i: CatalogItem) => string, number][] = [
  [(i) => i.title, 5],
  [(i) => i.sku ?? '', 4],
  [(i) => i.section ?? '', 3],
  [
    (i) =>
      Object.values(i.specs)
        .map((v) => specText(v) ?? '')
        .join(' '),
    2,
  ],
  [(i) => i.summary ?? '', 1],
];

function score(item: CatalogItem, words: readonly string[]): number {
  let total = 0;
  for (const word of words) {
    let best = 0;
    for (const [field, weight] of FIELDS) {
      const tokens = normalize(field(item))
        .split(/[^\p{L}\p{N}]+/u)
        .filter(Boolean);
      if (tokens.some((t) => wordMatches(word, t))) best = Math.max(best, weight);
    }
    if (best === 0) return 0;
    total += best;
  }
  return total;
}

/**
 * Поиск по позициям каталога.
 *
 * @remarks
 * Каждое слово запроса должно найтись хоть где-то; выше те, у кого совпало в
 * более важном поле. Пустая выдача в своей раскладке - пробуется другая: человек
 * набрал «fqajy», имея в виду «айфон». Синонимы владельца подставляет тот, кто
 * зовёт поиск, до вызова.
 */
export function searchItems<T extends CatalogItem>(items: readonly T[], query: string): T[] {
  const run = (q: string): T[] => {
    const words = normalize(q).split(' ').filter(Boolean).slice(0, 8);
    if (words.length === 0) return [...items];
    return items
      .map((item) => ({ item, s: score(item, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  };
  const direct = run(query);
  if (direct.length > 0 || !normalize(query)) return direct;
  return run(switchLayout(normalize(query)));
}
