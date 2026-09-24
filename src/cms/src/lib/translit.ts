/**
 * Перевод русского текста в латиницу.
 *
 * @remarks
 * Одна таблица на весь сайт: по ней считается и адрес записи, и имя залитого
 * файла. Разойдись они - и одно и то же слово писалось бы в адресе страницы
 * одним образом, а в имени файла другим.
 *
 * Таблица та же, что в переносчике из Ghost: адрес перевезённой записи и адрес
 * заведённой в админке должны совпадать.
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
 * Имя залитого файла латиницей.
 *
 * @remarks
 * Файл приходит с тем именем, какое дал автор: «монтаж вентеляции.webp».
 * В адресе это оборачивается пробелами и кириллицей - раздача кеширует такой
 * адрес по-своему, а в пересланной ссылке он рвётся на первом же пробеле.
 *
 * Правило то же, что у адресов записей, поэтому одно и то же слово в имени
 * файла и в адресе страницы пишется одинаково. Расширение остаётся как есть,
 * приведённое к нижнему регистру: по нему определяется тип файла.
 *
 * Имя, от которого после чистки ничего не осталось - из одних знаков или
 * иероглифов, - становится словом `file`: пустое имя хранилище не примет.
 */
export function latinFilename(name: string): string {
  const at = name.lastIndexOf('.');
  const hasExtension = at > 0 && at < name.length - 1;
  const base = hasExtension ? name.slice(0, at) : name;
  const extension = hasExtension ? name.slice(at + 1).toLowerCase() : '';

  const clean = translitSlug(base) || 'file';
  return extension ? `${clean}.${extension}` : clean;
}
