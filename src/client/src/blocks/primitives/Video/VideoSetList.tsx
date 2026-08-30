import type { VideoSetItem } from 'contracts';

import { VideoSetColumn } from './VideoSetColumn';
import { VideoSetStrip } from './VideoSetStrip';
import { VideoSetTiles } from './VideoSetTiles';

/**
 * @deprecated Представление выбирается снаружи: {@link VideoSetColumn} колонкой,
 * {@link VideoSetStrip} лентой, {@link VideoSetTiles} плиткой.
 *
 * @remarks
 * Здесь три представления жили в одном компоненте и выбирались свойством -
 * ровно тот случай, который правила называют ошибкой: сетка с режимом «карусель»
 * и список с режимом «сетка» это разные вещи, а не одна с переключателем.
 *
 * Обёртка оставлена ради сайтов, собранных на этом шаблоне: их доменный код зовёт
 * список отсюда, и убрать сразу значит сломать им сборку (R10). Уйдёт после того,
 * как они получат синк и переедут на нужное представление.
 */
export interface VideoSetListProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly channel: string | null;
  readonly orientation?: 'vertical' | 'horizontal' | 'grid';
  readonly tileLayout?: string | null | undefined;
  readonly maxHeight?: string | undefined;
  readonly limit?: number | undefined;
  readonly currentCode?: string | null;
  readonly setCode?: string | null;
  readonly onSelect?: ((item: VideoSetItem) => void) | undefined;
  readonly unlocking?: boolean;
  readonly className?: string;
}

export function VideoSetList({
  orientation = 'vertical',
  tileLayout,
  maxHeight,
  limit,
  ...rest
}: VideoSetListProps) {
  if (orientation === 'grid') return <VideoSetTiles tileLayout={tileLayout} {...rest} />;
  if (orientation === 'horizontal') return <VideoSetStrip {...rest} />;
  return <VideoSetColumn maxHeight={maxHeight} limit={limit} {...rest} />;
}
