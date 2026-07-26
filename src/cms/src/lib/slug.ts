import type { CollectionBeforeValidateHook } from 'payload';

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
 * beforeValidate-хук: заполняет пустой slug из указанного поля.
 *
 * @remarks
 * Именно `beforeValidate`, а не `beforeChange` — иначе `required: true` у slug
 * (Pages) отвергнет документ раньше, чем хук успеет его заполнить.
 *
 * Slug заполняется только при создании документа. У существующего не трогаем
 * ничего: правка заголовка не должна менять URL опубликованной записи, а
 * пустой slug у страницы — это осознанное значение (главная), а не пропуск.
 */
export const slugFrom =
  (sourceField: string): CollectionBeforeValidateHook =>
  ({ data, operation }) => {
    if (!data) return data;
    // Только create: у существующего документа slug не трогаем — правка
    // заголовка не должна менять URL. При create Payload передаёт пустой
    // originalDoc, так что ориентироваться на него нельзя, только на operation.
    if (operation !== 'create') return data;

    const current = data['slug'];
    if (typeof current === 'string' && current.trim()) return data;

    const source = data[sourceField];
    if (typeof source === 'string' && source.trim()) {
      data['slug'] = translitSlug(source);
    }

    return data;
  };
