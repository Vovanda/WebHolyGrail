import type { VideoSetItem } from 'contracts';

import { CarouselDeck, CarouselItem } from '@/blocks/arrangements/Carousel';

import { VideoSetEmpty, videoSetCard, type VideoSetCardsArgs } from './video-set-cards';

/**
 * Плейлист лентой.
 *
 * @remarks
 * Так он стоит под плеером, где колонка отняла бы всю высоту. Листается пальцем
 * и стрелками той же каруселью, что и остальные ленты сайта: инерция, прилипание
 * и поведение на телефоне уже собраны там, и своё писать незачем.
 */
export interface VideoSetStripProps extends VideoSetCardsArgs {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly className?: string;
}

export function VideoSetStrip({ items, className, ...cards }: VideoSetStripProps) {
  if (items.length === 0) return <VideoSetEmpty />;

  return (
    <CarouselDeck mode="row" gap="md" arrows label="Видео плейлиста" className={className}>
      {items.map((item, index) => (
        // Ширина карточки берётся уже: лента показывает край следующей, и по нему
        // видно, что набор продолжается.
        <CarouselItem key={item.code} width="min(16rem, 78vw)">
          {videoSetCard(item, index, { ...cards, orientation: 'horizontal' })}
        </CarouselItem>
      ))}
    </CarouselDeck>
  );
}
