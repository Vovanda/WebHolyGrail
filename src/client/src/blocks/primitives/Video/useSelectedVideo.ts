'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VideoSetItem } from 'contracts';

import { VIDEO_PARAM, selectVideo } from './selected-video';

/**
 * Событие о смене выбранного видео.
 *
 * @remarks
 * Запись в адрес браузер никому не сообщает: `popstate` приходит только при
 * переходах назад и вперёд. А списков на странице бывает два - рядом с плеером
 * и в боковой панели, которую собирает раскладка, - и оба должны показать одно
 * и то же видео отмеченным.
 */
export const VIDEO_SELECTED_EVENT = 'whg:video-selected';

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
    window.addEventListener(VIDEO_SELECTED_EVENT, read);
    return () => {
      window.removeEventListener('popstate', read);
      window.removeEventListener(VIDEO_SELECTED_EVENT, read);
    };
  }, []);

  const select = useCallback((item: VideoSetItem) => {
    setCode(item.code);

    const url = new URL(window.location.href);
    url.searchParams.set(VIDEO_PARAM, item.code);
    window.history.pushState(null, '', url);

    // Своё состояние обновилось строкой выше, а соседний список о записи в
    // адрес не узнает: браузер о ней не сообщает.
    window.dispatchEvent(new Event(VIDEO_SELECTED_EVENT));
  }, []);

  return { current: selectVideo(items, code), select };
}
