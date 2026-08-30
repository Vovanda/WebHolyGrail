import type { VideoSetItem } from 'contracts';

import { ScrollList } from '@/blocks/arrangements/ScrollList';

import { VideoSetEmpty, videoSetCards, type VideoSetCardsArgs } from './video-set-cards';

/**
 * Плейлист колонкой.
 *
 * @remarks
 * Так он стоит рядом с плеером и там, где записей много: у колонки своя
 * прокрутка с потолком по высоте и порциями. Длинная серия иначе утаскивает
 * вниз всю страницу, а сотня карточек разом заметно дольше рисуется.
 *
 * Место запоминается по самой подборке: вернувшись, зритель видит список там же,
 * где оставил.
 */
export interface VideoSetColumnProps extends VideoSetCardsArgs {
  readonly items: ReadonlyArray<VideoSetItem>;
  /**
   * Потолок высоты.
   *
   * @remarks
   * Рядом с плеером колонка равняется по нему, в панели занимает её целиком.
   * Без значения растёт по содержимому.
   */
  readonly maxHeight?: string | undefined;
  /** Сколько карточек показать сразу; остальные подгружаются при прокрутке. */
  readonly limit?: number | undefined;
  readonly className?: string;
}

export function VideoSetColumn({
  items,
  maxHeight,
  limit,
  className,
  ...cards
}: VideoSetColumnProps) {
  if (items.length === 0) return <VideoSetEmpty />;

  // К играющей записи колонка подъезжает сама.
  const at = items.findIndex((item) => item.code === (cards.currentCode ?? null));

  return (
    <ScrollList
      maxHeight={maxHeight}
      limit={limit}
      more="scroll"
      activeIndex={at >= 0 ? at : undefined}
      rememberKey={cards.setCode ? `set:${cards.setCode}` : undefined}
      label="Видео плейлиста"
      className={className}
    >
      {videoSetCards(items, cards)}
    </ScrollList>
  );
}
