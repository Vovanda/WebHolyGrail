import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  Field,
  PayloadRequest,
} from 'payload';

/**
 * Slug из заголовка: кириллица транслитерируется в латиницу (#70).
 *
 * @remarks
 * Раньше каждая коллекция чистила заголовок своей регуляркой и кириллицу
 * оставляла как есть — «Кто я такой?» уезжал в URL кириллицей, и slug
 * приходилось писать латиницей руками.
 *
 * Таблица — та же что в импортёре Ghost, чтобы slug перевезённой записи и
 * slug созданной в админке считались одинаково.
 */
const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Максимальная длина slug — режем по границе слова, не посреди него. */
const MAX_SLUG_LENGTH = 80;

export function translitSlug(value: string, maxLength: number = MAX_SLUG_LENGTH): string {
  const slug = value
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= maxLength) return slug;

  const cut = slug.slice(0, maxLength);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

/**
 * Поля-заголовки, из которых берётся slug, в порядке предпочтения.
 *
 * @remarks
 * Порядок не алфавитный: `nickname` раньше `fullName`, потому что у человека с
 * псевдонимом в адресе страницы ожидают именно псевдоним.
 */
const SOURCE_CANDIDATES = ['title', 'nickname', 'name', 'label', 'fullName', 'heading'] as const;

/**
 * Поля коллекции с раскрытыми presentational-контейнерами.
 *
 * @remarks
 * `row`, `collapsible`, `tabs` и безымянные `group` существуют только в вёрстке
 * админки — в документе их поля лежат на верхнем уровне. Без раскрытия
 * заголовок, завёрнутый в `row` ради ширины колонки, выглядит как
 * отсутствующий (так было у FaqGroups), и slug молча не генерировался.
 *
 * Именованные `group`, `array` и `blocks` не раскрываем: их данные вложены, и
 * `data['title']` оттуда не прочитать.
 */
function flatFields(fields: readonly Field[]): Field[] {
  return fields.flatMap((field): Field[] => {
    if (field.type === 'row' || field.type === 'collapsible') return flatFields(field.fields);
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => ('name' in tab && tab.name ? [] : flatFields(tab.fields)));
    }
    if (field.type === 'group' && !('name' in field && field.name)) return flatFields(field.fields);
    return [field];
  });
}

/**
 * Свободный slug: `base`, `base-2`, `base-3`, …
 *
 * @remarks
 * Slug почти везде `unique`, а одинаковые заголовки — обычное дело («Ремонт на
 * Ленина» у двух объектов, «Отзывы» у двух страниц). Без разведения человек
 * упирается в ошибку сохранения с текстом про constraint, причём на автосейве
 * черновика, где он вообще не нажимал «Сохранить».
 *
 * Занятые ищем одним запросом по префиксу, а не циклом «проверил — занято —
 * следующий»: заголовков-дублей может быть много, а запрос к базе на каждый —
 * задержка прямо в форме.
 */
async function freeSlug(
  base: string,
  {
    collection,
    req,
    id,
  }: { collection: string; req: PayloadRequest; id?: string | number | undefined },
): Promise<string> {
  const taken = await req.payload.find({
    collection: collection as Parameters<typeof req.payload.find>[0]['collection'],
    where: { slug: { like: base } },
    limit: 200,
    depth: 0,
    pagination: false,
    req,
    overrideAccess: true,
  });

  const busy = new Set(
    taken.docs
      .filter((doc) => (id === undefined ? true : String(doc.id) !== String(id)))
      .map((doc) => String((doc as { slug?: unknown }).slug ?? '')),
  );

  if (!busy.has(base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const candidate = `${base}-${n}`;
    if (!busy.has(candidate)) return candidate;
  }
  return base;
}

/**
 * beforeValidate-хук: заполняет пустой slug транслитом заголовка.
 *
 * @remarks
 * Заполняем по состоянию документа, а не по `operation === 'create'`. С
 * включённым автосохранением (`versions.drafts.autosave` — Pages, Articles,
 * ReusableBlocks) черновик заводится в базе раньше, чем человек успевает
 * напечатать заголовок: валидация `required` к черновикам не применяется,
 * поэтому `create` проходит с пустым `title`. Всё, что печатается дальше,
 * приходит уже как `update` — и хук, смотревший на `operation`, не срабатывал
 * никогда. Снаружи это выглядело как «автогенерация не работает».
 *
 * Условие на `create` изначально защищало от смены URL у опубликованной
 * записи. Ту же защиту даёт проверка `originalDoc.slug`: заполненный slug не
 * трогаем ни при каких правках заголовка, поэтому ссылки не ломаются.
 */
function autoSlugHook(
  collection: string,
  sources: readonly string[],
): CollectionBeforeValidateHook {
  return async ({ data, originalDoc, req, operation }) => {
    if (!data) return data;

    const incoming = data['slug'];
    if (typeof incoming === 'string' && incoming.trim()) return data;

    const existing = (originalDoc as { slug?: unknown } | undefined)?.slug;
    if (typeof existing === 'string' && existing.trim()) {
      // У документа уже есть адрес — оставляем как есть. Пустой `slug` в
      // запросе означает «поле не прислали», а не «сделай его пустым».
      data['slug'] = existing;
      return data;
    }

    const source = sources
      .map((field) => data[field] ?? (originalDoc as Record<string, unknown> | undefined)?.[field])
      .find((value): value is string => typeof value === 'string' && Boolean(value.trim()));
    if (!source) return data;

    const base = translitSlug(source);
    // Заголовок из одних эмодзи или иероглифов даёт пустую строку — тогда slug
    // остаётся человеку, автоматика тут ничего осмысленного не предложит.
    if (!base) return data;

    const id = operation === 'update' ? (originalDoc as { id?: string | number })?.id : undefined;
    data['slug'] = await freeSlug(base, { collection, req, id });
    return data;
  };
}

/**
 * Включает автозаполнение slug для коллекции, если ей есть что заполнять.
 *
 * @remarks
 * Вешается на весь список коллекций в `payload.config.ts`, а не построчно по
 * файлам. Причина простая: построчно забывают. На момент введения обёртки slug
 * был у восьми коллекций, а хук — у шести, причём `Specialists` держал
 * собственную копию логики с той же ошибкой, а `FaqGroups` осталась без
 * автогенерации вовсе. Новая коллекция со slug получает поведение бесплатно и
 * не может «забыть» его подключить.
 *
 * Источник заголовка ищется среди {@link SOURCE_CANDIDATES}. Если у коллекции
 * он называется иначе или нужен другой приоритет — `custom.slugFrom`. Совсем
 * выключить — `custom.autoSlug: false` (нужно там, где slug несёт не
 * заголовок, а код или артикул).
 */
export function withAutoSlug(collection: CollectionConfig): CollectionConfig {
  const custom = collection.custom as
    | { autoSlug?: boolean; slugFrom?: string | readonly string[] }
    | undefined;
  if (custom?.autoSlug === false) return collection;

  const flat = flatFields(collection.fields);
  const hasSlug = flat.some((field) => 'name' in field && field.name === 'slug');
  if (!hasSlug) return collection;

  const present = new Set(
    flat.flatMap((field) => ('name' in field && field.name ? [field.name] : [])),
  );
  const configured = custom?.slugFrom;
  const sources = configured
    ? [configured].flat()
    : SOURCE_CANDIDATES.filter((name) => present.has(name));
  if (sources.length === 0) return collection;

  return {
    ...collection,
    hooks: {
      ...collection.hooks,
      beforeValidate: [
        autoSlugHook(collection.slug, sources),
        ...(collection.hooks?.beforeValidate ?? []),
      ],
    },
  };
}
