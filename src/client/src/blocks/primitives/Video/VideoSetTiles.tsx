import type { VideoSetItem } from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';

import { VideoSetEmpty, videoSetCard, type VideoSetCardsArgs } from './video-set-cards';

/**
 * Плейлист плиткой.
 *
 * @remarks
 * Так он стоит отдельным блоком, где плеера нет вовсе. Раскладка та же, что
 * у остальных плиток сайта: ряды подбираются без сироты внизу, а владелец может
 * задать свою фигуру - выделить первую запись крупной, увести какую-то ниже.
 * Ничего своего здесь не считается.
 */
export interface VideoSetTilesProps extends VideoSetCardsArgs {
  readonly items: ReadonlyArray<VideoSetItem>;
  /** Фигура раскладки от владельца. Пусто - плитка считает сама. */
  readonly tileLayout?: string | null | undefined;
  readonly className?: string;
}

export function VideoSetTiles({ items, tileLayout, className, ...cards }: VideoSetTilesProps) {
  if (items.length === 0) return <VideoSetEmpty />;

  return (
    <CardRows items={items} columns={3} gap="md" tileLayout={tileLayout} className={className}>
      {(item, index) => videoSetCard(item, index, cards)}
    </CardRows>
  );
}
