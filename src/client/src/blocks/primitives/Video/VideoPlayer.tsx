'use client';

import { useEffect, useState } from 'react';

import { VideoPlayerChrome, type VideoPlayerChromeProps } from './VideoPlayerChrome';
import { VideoPlayerVidstack } from './VideoPlayerVidstack';

/**
 * Плеер видео: выбирает слой управления по флагу.
 *
 * @remarks
 * Слоёв два, и пока непонятно, какой останется. Первый собран на media-chrome
 * своими руками, второй берёт готовый слой Vidstack. Оба работают с одним
 * потоком и одним ключом шифрования, поэтому переключение ничего не ломает.
 *
 * Значение по умолчанию приходит из окружения (`NEXT_PUBLIC_VIDEO_UI`) и
 * меняется без сборки. Поверх него работает `?player=` в адресе - им можно
 * посмотреть оба варианта на одной и той же странице подряд, ничего не
 * выкладывая.
 */
export type VideoPlayerProps = VideoPlayerChromeProps;

type Ui = 'chrome' | 'vidstack';

/** Слой по умолчанию: меняется переменной окружения, без сборки. */
const DEFAULT_UI: Ui = process.env.NEXT_PUBLIC_VIDEO_UI === 'vidstack' ? 'vidstack' : 'chrome';

export function VideoPlayer(props: VideoPlayerProps) {
  const [ui, setUi] = useState<Ui>(DEFAULT_UI);

  // Адрес читаем после появления страницы: на сервере его нет, и разметка
  // должна совпасть с той, что браузер получил первой.
  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get('player');
    if (asked === 'vidstack' || asked === 'chrome') setUi(asked);
  }, []);

  return ui === 'vidstack' ? <VideoPlayerVidstack {...props} /> : <VideoPlayerChrome {...props} />;
}
