'use client';

import {
  type CatalogResultView,
  laneNextPage,
  laneRing,
  type OfferView,
  PAGE_SIZE,
} from 'contracts';
import { useCallback, useRef, useState } from 'react';

import { CarouselDeck, CarouselItem } from '@/blocks/arrangements/Carousel';

import { OfferTile } from './OfferTile';

/** За сколько карточек до края загруженного просить следующую страницу. */
const LOOKAHEAD = 8;

/**
 * Лента позиций раздела по кругу: идёт шагом на карточку, под указателем стоит.
 *
 * @remarks
 * Сервер отдаёт начало раздела и его хвост: в кольце последние позиции стоят
 * перед первой, и при обратном ходе видны сразу. Середина догружается страницами
 * выдачи через `/internal/shop/catalog`, когда до края загруженного остаётся
 * несколько карточек; какую страницу брать, решает `laneNextPage`. Раздел, целиком
 * пришедший в начале, не догружается вовсе, как и готовый список без раздела
 * («Похожие» у товара).
 *
 * Соседние ленты на странице идут навстречу (`reverse`) и в разном темпе
 * (`delay`), чтобы не сливаться в один поток. Части: `lane` и части `OfferTile`.
 */
export function OfferLane({
  section,
  count,
  head,
  tail = [],
  cartHref,
  reverse = false,
  delay = 4000,
  label,
}: {
  /** Слаг раздела - для догрузки страниц. Без него лента показывает только то, что дали. */
  readonly section?: string | undefined;
  /** Сколько позиций в разделе всего; без раздела - не нужно. */
  readonly count?: number | undefined;
  readonly head: readonly OfferView[];
  readonly tail?: readonly OfferView[] | undefined;
  readonly cartHref: string;
  readonly reverse?: boolean;
  /** Пауза между шагами, мс. */
  readonly delay?: number;
  readonly label?: string;
}) {
  const [pages, setPages] = useState<readonly (readonly OfferView[])[]>([]);
  const loading = useRef(false);
  const ring = laneRing(head, pages, tail);

  const more = useCallback(
    (index: number) => {
      if (loading.current || !section || count === undefined) return;
      const edge = ring.length - tail.length;
      if (index + LOOKAHEAD < edge) return;
      const page = laneNextPage(count, head.length, tail.length, pages.length, PAGE_SIZE);
      if (page === null) return;
      loading.current = true;
      void fetch(`/internal/shop/catalog?section=${encodeURIComponent(section)}&page=${page}`)
        .then((r) => (r.ok ? (r.json() as Promise<CatalogResultView>) : null))
        .then((answer) => {
          // Ответа нет - страница считается пустой: лента не просит её по кругу.
          setPages((prev) => (prev.length === page - 1 ? [...prev, answer?.items ?? []] : prev));
        })
        .catch(() => setPages((prev) => (prev.length === page - 1 ? [...prev, []] : prev)))
        .finally(() => {
          loading.current = false;
        });
    },
    [ring.length, tail.length, count, head.length, pages.length, section],
  );

  return (
    // Без min-w-0 элемент сетки растягивается под всю ленту, и листать становится нечего.
    <div data-part="lane" className="min-w-0">
      <CarouselDeck
        mode="row"
        loop
        autoplay={delay}
        reverse={reverse}
        gap="sm"
        label={label}
        onIndexChange={more}
      >
        {ring.map((offer) => (
          <CarouselItem key={offer.id} width="min(13rem, 44vw)">
            <OfferTile offer={offer} cartHref={cartHref} />
          </CarouselItem>
        ))}
      </CarouselDeck>
    </div>
  );
}
