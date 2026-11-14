import { CATALOG_HREF, type MediaRef, type SectionNode } from 'contracts';
import Link from 'next/link';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { MediaImage } from '@/blocks/primitives/Media';
import { MediaPlaceholder } from '@/blocks/primitives/Media/MediaPlaceholder';
import { positions } from '@/lib/shop/positions';

/**
 * Подразделы плитками сверху раздела: картинка, название, сколько позиций.
 *
 * @remarks
 * Как у больших магазинов: из «Инструмента» сразу видно, что внутри, и в нужный
 * подраздел - одно нажатие. Без картинки у плитки нейтральное поле с иконкой,
 * как у карточки позиции. Части: `section-tiles`, `section-tile`.
 */
export function SectionTiles({ nodes }: { readonly nodes: readonly SectionNode[] }) {
  if (nodes.length === 0) return null;
  return (
    <div data-part="section-tiles" className="mt-6">
      <CardRows
        as="ul"
        items={nodes}
        columns={6}
        columnsMd={4}
        columnsSm={2}
        gap="sm"
        keepColumns
        evenRows={false}
        fullRows
      >
        {(node) => (
          <Link
            href={`${CATALOG_HREF}/${node.slug}`}
            data-part="section-tile"
            className="flex h-full flex-col rounded-2xl bg-surface p-3 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-accent"
          >
            <span className="line-clamp-2 text-sm font-semibold leading-5 text-ink">
              {node.title}
            </span>
            <span className="mt-0.5 text-xs text-muted">{positions(node.count)}</span>
            <span className="mt-3 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl text-muted">
              {typeof node.image === 'object' && node.image ? (
                <MediaImage
                  media={node.image as MediaRef}
                  place="(max-width: 767px) 50vw, 200px"
                  alt=""
                  zoom={false}
                  className="h-full w-full object-contain"
                />
              ) : (
                <MediaPlaceholder size={32} />
              )}
            </span>
          </Link>
        )}
      </CardRows>
    </div>
  );
}
