/**
 * Адрес сайта без косой черты в конце.
 *
 * @remarks
 * Задаётся окружением: у каждого сайта он свой, и зашивать его в код нельзя.
 */
export function siteUrl(): string {
  return (
    process.env['NEXT_PUBLIC_SITE_URL'] ??
    process.env['SITE_URL'] ??
    'http://localhost:3000'
  ).replace(/\/+$/, '');
}

/**
 * Имя главной страницы.
 *
 * @remarks
 * В базе она лежит под этим именем, а у посетителя открывается корнем сайта.
 * Предпросмотр обязан вести именно туда: на `/home` страница показывается
 * с крошками и в остальном ведёт себя как внутренняя, и правка проверялась бы
 * не в том виде, в каком её увидят.
 */
const ROOT = 'home';

/**
 * Адрес страницы, на которой запись видна посетителю.
 *
 * @remarks
 * Нужен предпросмотру: владелец правит статью и хочет увидеть её страницей,
 * а не перечнем полей. Запись без имени в адресе получает `null`: своей
 * страницы у неё ещё нет.
 */
export function previewPath(prefix: string, slug: unknown): string | null {
  if (typeof slug !== 'string') return null;
  const clean = slug.replace(/^\/+|\/+$/g, '');
  if (!prefix && (!clean || clean === ROOT)) return `${siteUrl()}/`;
  if (!clean && prefix) return null;
  return `${siteUrl()}/${[prefix, clean].filter(Boolean).join('/')}`;
}
