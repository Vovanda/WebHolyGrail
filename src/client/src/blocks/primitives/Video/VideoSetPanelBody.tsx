'use client';

import type { VideoSetItem } from 'contracts';

import { VideoSetList } from './VideoSetList';
import { useSelectedVideo } from './useSelectedVideo';
import { useUnlockableItems } from './useUnlockableItems';

/**
 * Список плейлиста внутри боковой панели.
 *
 * @remarks
 * Панель собирает раскладка, а плеер приходит блоком страницы - это разные
 * ветки разметки, и передать выбор между ними пропсом нельзя. Общим языком
 * служит адрес: нажатие здесь меняет `?v=<код>`, а плеер его читает.
 *
 * Замки снимаются тем же событием, что и в списке рядом с плеером: код
 * вводится один раз, а открыться должно везде, где видео видно.
 */
export interface VideoSetPanelBodyProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly channel: string | null;
  readonly setCode: string | null;
}

export function VideoSetPanelBody({ items: initial, channel, setCode }: VideoSetPanelBodyProps) {
  const { items, unlocking } = useUnlockableItems(initial);
  const { current, select } = useSelectedVideo(items);

  return (
    <VideoSetList
      items={items}
      channel={channel}
      setCode={setCode}
      currentCode={current?.code ?? null}
      onSelect={select}
      unlocking={unlocking}
      maxHeight="100%"
    />
  );
}
