'use client';

import { offerViewOf, type OfferView } from 'contracts';

import { cart } from './cart';
import { OFFER_SNAPSHOTS, writeSnapshots } from './snapshots';

/**
 * Положить позицию в корзину из подсказки поиска.
 *
 * @remarks
 * Позиция кладётся сверх того, что уже в корзине, а её карточка запоминается
 * снимком: строка корзины появляется сразу, не дожидаясь сверки с магазином.
 */
export function addOffer(offer: OfferView, quantity = 1): void {
  writeSnapshots(OFFER_SNAPSHOTS, { [String(offer.id)]: offerViewOf(offer) });
  cart.add(offer.id, quantity);
}
