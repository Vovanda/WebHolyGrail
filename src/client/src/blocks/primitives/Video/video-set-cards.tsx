import type { ReactElement } from 'react';
import type { VideoSetItem } from 'contracts';

import { VideoSetCard } from './VideoSetCard';

/**
 * Общее у всех представлений плейлиста: как из записи получается карточка.
 *
 * @remarks
 * Представлений три - колонкой, лентой и плиткой, - и раньше они жили в одном
 * компоненте, который выбирал вид свойством. Вид выбирает тот, кто ставит,
 * а общей у них остаётся только карточка: её и держим здесь, чтобы три
 * представления не разошлись по виду карточки.
 */

export interface VideoSetCardsArgs {
  readonly channel: string | null;
  /** Отмеченная запись - та, что играет сейчас. */
  readonly currentCode?: string | null;
  /** Подборка, из которой пришли: с ней ссылка ведёт обратно в неё же. */
  readonly setCode?: string | null;
  /** Нажатие вместо перехода - когда плеер рядом и уходить со страницы незачем. */
  readonly onSelect?: ((item: VideoSetItem) => void) | undefined;
  /** Замки сейчас снимаются: держим их на месте, но проигрываем анимацию. */
  readonly unlocking?: boolean;
  /** Как повёрнута сама карточка. */
  readonly orientation?: 'vertical' | 'horizontal';
}

/** Одна карточка записи - в том виде, в каком её берёт любая раскладка. */
export function videoSetCard(item: VideoSetItem, index: number, args: VideoSetCardsArgs) {
  return (
    <VideoSetCard
      key={item.code}
      item={item}
      index={index + 1}
      channel={args.channel}
      orientation={args.orientation ?? 'vertical'}
      current={item.code === (args.currentCode ?? null)}
      setCode={args.setCode ?? null}
      onSelect={args.onSelect}
      unlocking={args.unlocking === true}
    />
  );
}

/** Все карточки набора: раскладке остаётся разложить их по местам. */
export function videoSetCards(
  items: ReadonlyArray<VideoSetItem>,
  args: VideoSetCardsArgs,
): ReadonlyArray<ReactElement> {
  return items.map((item, index) => videoSetCard(item, index, args));
}

/** Пусто - об этом говорят словами, а не оставляют голое место. */
export function VideoSetEmpty() {
  return <p className="text-body text-muted">В плейлисте пока нет видео.</p>;
}
