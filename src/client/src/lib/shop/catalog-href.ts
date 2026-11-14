import { type Characteristic, type FilterState, writeFilter } from 'contracts';

type Search = Readonly<Record<string, string | string[] | undefined>>;

/**
 * Адрес выдачи с фильтром и запросом поиска.
 *
 * @remarks
 * Одна функция на галочку панели, переключатель быстрых фильтров и «Сбросить»:
 * адреса совпадают буква в букву, и одна подборка не живёт под двумя ссылками.
 */
export function catalogHref(
  basePath: string,
  state: FilterState,
  characteristics: readonly Characteristic[],
  query = '',
): string {
  const params = new URLSearchParams(writeFilter(state, characteristics));
  if (query) params.set('q', query);
  const search = params.toString();
  return search ? `${basePath}?${search}` : basePath;
}

/**
 * Поля формы диапазона в адрес фильтра.
 *
 * @returns строку канонического адреса, если в запросе были поля формы;
 *   null - запрос уже канонический, переадресация не нужна.
 */
export function rangesFromForm(
  search: Search,
  characteristics: readonly Characteristic[],
): string | null {
  const keys = Object.keys(search);
  if (!keys.some((k) => /\.(min|max)$/.test(k))) return null;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (typeof v !== 'string' || /\.(min|max)$/.test(k)) continue;
    params.set(k, v);
  }
  for (const c of characteristics) {
    const min = search[`${c.key}.min`];
    const max = search[`${c.key}.max`];
    const lo = typeof min === 'string' ? min.trim() : '';
    const hi = typeof max === 'string' ? max.trim() : '';
    if (lo || hi) params.set(c.key, `${lo}..${hi}`);
    else if (keys.includes(`${c.key}.min`)) params.delete(c.key);
  }
  return params.toString();
}
