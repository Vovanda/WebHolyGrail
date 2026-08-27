/**
 * На этом ли адресе показывается панель.
 *
 * @remarks
 * Раскладка одна на весь сайт, поэтому панель без масок попадает на каждую
 * страницу - так было до появления этого поля, и таким остаётся поведение по
 * умолчанию.
 *
 * Маска читается по кусочкам между косыми чертами: звёздочка на месте кусочка
 * означает любой один, звёздочка в конце - «и всё, что дальше». Этого хватает
 * на адреса вида `/@канал/p/код`, а разбор путей целиком ради нескольких
 * панелей тянуть незачем.
 *
 * Хвостовая косая черта не считается: `/video` и `/video/` для человека одно
 * и то же, и панель не должна пропадать от лишнего символа в ссылке.
 */

/** Кусочки адреса между косыми чертами, без пустых. */
function partsOf(path: string): ReadonlyArray<string> {
  return path.split('/').filter((part) => part.length > 0);
}

/**
 * Совпадает ли кусочек адреса с кусочком маски.
 *
 * @remarks
 * Звёздочка стоит и вместо всего кусочка, и внутри него: `@*` покрывает любой
 * канал, а `*` - любое имя целиком.
 */
function partMatches(maskPart: string, part: string | undefined): boolean {
  if (part === undefined) return false;
  if (maskPart === '*') return true;
  if (!maskPart.includes('*')) return maskPart === part;

  const pattern = maskPart
    .split('*')
    .map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${pattern}$`).test(part);
}

/** Совпадает ли адрес с одной маской. */
function matchesMask(mask: string, parts: ReadonlyArray<string>): boolean {
  const maskParts = partsOf(mask);
  const openEnded = maskParts[maskParts.length - 1] === '*';

  // Короткий адрес под длинную маску не подходит; лишние кусочки допустимы
  // только когда маска кончается звёздочкой.
  if (parts.length < maskParts.length - (openEnded ? 1 : 0)) return false;
  if (!openEnded && parts.length !== maskParts.length) return false;

  return maskParts.every((maskPart, at) =>
    // Звёздочка в конце уже разрешила всё, что дальше.
    openEnded && at === maskParts.length - 1 ? true : partMatches(maskPart, parts[at]),
  );
}

/** Показывается ли панель с такими масками на этом адресе. */
export function panelMatchesRoute(
  routes: ReadonlyArray<string> | undefined,
  pathname: string | null | undefined,
): boolean {
  if (!routes || routes.length === 0) return true;

  // Адрес неизвестен - показываем: пропавшая панель заметнее лишней, а
  // заголовок с путём может не дойти, например при отдаче из кеша.
  if (!pathname) return true;

  const parts = partsOf(pathname);
  return routes.some((mask) => mask.trim().length > 0 && matchesMask(mask.trim(), parts));
}
