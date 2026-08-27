'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

import { VIDEO_PARAM, selectVideo } from './selected-video';

/**
 * Выбранное видео плейлиста, живущее в адресе.
 *
 * @remarks
 * Адрес читается после появления страницы: на сервере его нет, и разметка
 * должна совпасть с той, что браузер получил первой. До этого показывается
 * первое играющее видео - оно же остаётся, если в адресе ничего нет.
 *
 * Нажатие в списке добавляет запись в историю, поэтому «назад» возвращает к
 * предыдущему видео, а не уводит со страницы. Прокрутку при этом не трогаем:
 * плеер стоит на месте, и прыжок наверх выглядел бы поломкой.
 */
export function useSelectedVideo(items: ReadonlyArray<VideoSetItem>): {
  readonly current: VideoSetItem | null;
  readonly select: (item: VideoSetItem) => void;
} {
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    function read() {
      setCode(new URLSearchParams(window.location.search).get(VIDEO_PARAM));
    }
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const select = useCallback((item: VideoSetItem) => {
    setCode(item.code);

    const url = new URL(window.location.href);
    url.searchParams.set(VIDEO_PARAM, item.code);
    window.history.pushState(null, '', url);
  }, []);

  return { current: selectVideo(items, code), select };
}
