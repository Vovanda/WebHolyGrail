/**
 * Снимки того, что покупатель уже видел: карточки позиций и заказы.
 *
 * @remarks
 * Корзина и «Мои заказы» открываются мгновенно: строки рисуются из снимка,
 * а ответ сервера их сверяет и обновляет. Снимок - только для показа: цену
 * заказа сервер всё равно берёт из базы, поэтому устаревший или подменённый
 * снимок ни на что, кроме первой секунды показа, не влияет.
 *
 * Хранилище бывает недоступно (приватное окно, запрет сайта) - тогда снимков
 * нет, и всё грузится как раньше, с сервера.
 */
const LIMIT = 100;

export function readSnapshots<T>(key: string): Record<string, T> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, T>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Дописать снимки. Больше сотни не держим, чтобы хранилище не росло без конца:
 * лишние отбрасываются с начала списка ключей (у числовых ключей это меньшие
 * номера, а не самые старые записи - для показа это неважно, сервер догрузит).
 */
export function writeSnapshots<T>(key: string, entries: Readonly<Record<string, T>>): void {
  try {
    const merged = { ...readSnapshots<T>(key), ...entries };
    const keys = Object.keys(merged);
    const kept = keys.length > LIMIT ? keys.slice(keys.length - LIMIT) : keys;
    window.localStorage.setItem(
      key,
      JSON.stringify(Object.fromEntries(kept.map((k) => [k, merged[k]]))),
    );
  } catch {
    // Не записали - в следующий раз строки придут с сервера.
  }
}

export function dropSnapshot(key: string, id: string): void {
  try {
    const rest = readSnapshots<unknown>(key);
    delete rest[id];
    window.localStorage.setItem(key, JSON.stringify(rest));
  } catch {
    // Не удалили - снимок перезапишется при следующем ответе сервера.
  }
}

export const OFFER_SNAPSHOTS = 'whg-offer-snapshots';
export const ORDER_SNAPSHOTS = 'whg-order-snapshots';
