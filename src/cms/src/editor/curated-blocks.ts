import { BlocksFeature } from '@payloadcms/richtext-lexical';
import type { Block } from 'payload';

import { blockSearchWords } from './block-menu-items';

/** Что задаёт статья: весь набор блоков и частые из него. */
export interface CuratedBlocksProps {
  readonly blocks: Block[];
  /** Имена блоков, которые стоят в меню, в этом порядке. */
  readonly frequent: readonly string[];
}

export interface CuratedBlocksClientProps {
  readonly frequent: readonly string[];
  /** Подписи и имена остальных блоков: по ним слэш-меню находит «Другие компоненты». */
  readonly searchWords: readonly string[];
}

/**
 * Блоки в тексте с коротким меню: частые в «+» и в слэш-меню, остальные окном.
 *
 * @remarks
 * Штатная фича блоков выводит в меню весь набор - три десятка строк, в которых
 * нужное ищут глазами. Убрать пункты снаружи нечем: группы меню только
 * складываются. Поэтому здесь та же фича, под тем же ключом, но со своей
 * браузерной частью: она берёт штатные пункты и оставляет из них частые.
 *
 * Набор объявлен целиком: поля блока собираются на сервере по его имени,
 * и не объявленный здесь блок встал бы в текст пустой карточкой.
 */
export function CuratedBlocksFeature({ blocks, frequent }: CuratedBlocksProps) {
  const stock = BlocksFeature({ blocks });
  const build = stock.feature;
  if (typeof build !== 'function') return stock;

  return {
    ...stock,
    feature: async (args: Parameters<typeof build>[0]) => ({
      ...(await build(args)),
      ClientFeature: '/editor/curated-blocks.client#CuratedBlocksClientFeature',
      clientFeatureProps: {
        frequent,
        searchWords: blockSearchWords(blocks, frequent),
      } satisfies CuratedBlocksClientProps,
    }),
  };
}
