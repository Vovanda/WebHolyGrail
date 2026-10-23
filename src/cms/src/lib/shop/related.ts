import { boughtTogether, RELATED_LIMIT, similarItems } from 'contracts';

import type { OfferCard, ShopPorts } from './ports';

/** Сколько недавних заказов с позицией смотреть для «С этим часто берут». */
const BASKETS = 200;

/**
 * Ряды страницы позиции: похожие из её раздела и то, что берут вместе с ней.
 *
 * @remarks
 * Правила рядов - в contracts (`similarItems`, `boughtTogether`); здесь только чтение
 * карточек и заказов. Позиция вне разделов похожих не имеет.
 */
export async function relatedOffers(
  ports: ShopPorts,
  card: OfferCard,
): Promise<{ similar: OfferCard[]; together: OfferCard[] }> {
  const [section, baskets] = await Promise.all([
    card.section ? ports.offers.cards({ section: card.section }) : Promise.resolve([]),
    ports.orders.basketsWith(card.id, BASKETS),
  ]);
  const ids = boughtTogether(baskets, card.id, RELATED_LIMIT);
  const byId = new Map((ids.length ? await ports.offers.cards({ ids }) : []).map((c) => [c.id, c]));
  return {
    similar: similarItems(card, section),
    together: ids.flatMap((id) => {
      const c = byId.get(id);
      return c && c.price !== null ? [c] : [];
    }),
  };
}
