/**
 * Откуда пришёл запрос за ключом.
 *
 * @remarks
 * Ключ выдаётся плееру на нашем сайте. Чужая страница, встроившая наш поток,
 * получает от браузера пометку о своём происхождении - по ней такой запрос и
 * отсекается.
 *
 * Это заслон от чужой витрины, а не от выкачивания: скачиватель заголовки
 * подделает, и ловят его по частоте запросов. Здесь задача другая - чтобы
 * платный курс не крутился на стороннем сайте под чужой рекламой.
 *
 * Запрос без пометки о происхождении пропускаем: её не ставят при переходе по
 * прямой ссылке и в части приложений, а отказ там сломал бы обычный просмотр.
 */
export interface OriginCheck {
  readonly allowed: boolean;
  /** Что именно пришло: пригодится в журнале, когда доступ отказан. */
  readonly origin: string | null;
}

export function checkRequestOrigin(
  headers: { get(name: string): string | null } | undefined,
  allowed: ReadonlyArray<string>,
): OriginCheck {
  const raw = headers?.get('origin') ?? refererOrigin(headers?.get('referer') ?? null);
  if (!raw) return { allowed: true, origin: null };

  /*
    Проверяем только то, что похоже на настоящий адрес: браузер всегда ставит
    его со схемой. Мусор в заголовке - повод пропустить, а не отказать: иначе
    странное расширение в чужом браузере обрывает человеку просмотр.
  */
  if (!raw.includes('://')) return { allowed: true, origin: raw };

  const host = hostOf(raw);
  if (!host) return { allowed: true, origin: raw };

  const known = allowed.map(hostOf).filter((value): value is string => value !== null);
  return { allowed: known.includes(host), origin: raw };
}

/** Из полного адреса страницы берём только её происхождение. */
function refererOrigin(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

/**
 * Имя узла без схемы и порта.
 *
 * @remarks
 * Сравниваем по узлу: сайт живёт и на http, и на https, а за обратным прокси
 * порт до приложения не доходит.
 */
function hostOf(value: string): string | null {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}
