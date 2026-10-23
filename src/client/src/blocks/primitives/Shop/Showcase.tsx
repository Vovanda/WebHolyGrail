import type { BlockNode, OfferView, SiteSettings } from 'contracts';
import { shopSettings } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { listOffers } from '@/lib/api-client.engine';

import { OfferCard } from './OfferCard';

/**
 * Showcase - витрина магазина: плитка позиций с кнопкой «В корзину».
 *
 * @remarks
 * Рисуется на сервере (R14), браузерная только кнопка. Позиции - выбранные в
 * блоке или все по названию; цена приходит `Money` в валюте магазина. Позиция
 * без цены в корзину не кладётся - на карточке «Цена по запросу». Позиция с нулевым остатком
 * остаётся видна с пометкой: щенка уже забрали, но витрина помнит, что он был.
 * Без картинки верх карточки занимает само название крупным шрифтом: высота
 * совпадает с соседями, и пустой заглушки «фото скоро» нет.
 * Главное в карточке - цена; кнопка всегда внизу, на одном месте у всех карточек.
 * Части размечены `data-part` - вид меняется в «Виде блока».
 */
export interface ShowcaseData {
  readonly heading?: string;
  readonly description?: string;
  /** Выбранные позиции; пусто - все. */
  readonly offers?: readonly (number | { readonly id: number })[] | null;
  readonly cartHref?: string | null;
  readonly tileLayout?: string | null | undefined;
  readonly tileLayoutMd?: string | null | undefined;
  readonly tileLayoutSm?: string | null | undefined;
}

export async function Showcase({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: ShowcaseData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const picked = (data.offers ?? []).map((o) => (typeof o === 'number' ? o : o.id));
  const offers: OfferView[] = await listOffers(picked.length > 0 ? { ids: picked } : { limit: 60 });
  if (offers.length === 0) return null;
  const cartHref = data.cartHref?.trim() || shopSettings(settings.shop).cartHref;

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        {data.heading && (
          <h2
            data-part="title"
            className="font-display text-2xl font-semibold text-ink md:text-3xl"
          >
            {data.heading}
          </h2>
        )}
        {data.description && (
          <p data-part="subtitle" className="mt-2 text-muted">
            {data.description}
          </p>
        )}
        <CardRows
          as="ul"
          items={offers}
          columns={3}
          gap="md"
          tileLayout={data.tileLayout}
          tileLayoutMd={data.tileLayoutMd}
          tileLayoutSm={data.tileLayoutSm}
          keepColumns
          className="mt-6"
        >
          {(offer) => <OfferCard offer={offer} cartHref={cartHref} />}
        </CardRows>
      </div>
    </section>
  );
}
