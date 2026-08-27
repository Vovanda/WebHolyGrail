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
 * Значение приходит из настроек сайта, поэтому меняется в админке без
 * выкладки. Поверх него работает `?player=` в адресе - им можно посмотреть оба
 * варианта на одной странице подряд, ничего не переключая для остальных.
 */
export type VideoPlayerProps = VideoPlayerChromeProps & {
  /**
   * Какой слой управления рисовать.
   *
   * @remarks
   * Приходит из настроек сайта, поэтому владелец меняет его в админке без
   * выкладки. Адрес перекрывает это значение: так можно посмотреть второй
   * вариант, ничего не переключая для остальных.
   */
  readonly ui?: 'vidstack' | 'chrome' | undefined;
};

type Ui = 'chrome' | 'vidstack';

/**
 * Слой на случай, когда в настройках ничего не выбрано.
 *
 * @remarks
 * Выбор живёт в настройках сайта и меняется владельцем без выкладки. Здесь
 * остаётся запасное значение для страниц, которые настройки не читают.
 */
const DEFAULT_UI: Ui = process.env.NEXT_PUBLIC_VIDEO_UI === 'chrome' ? 'chrome' : 'vidstack';

export function VideoPlayer({ ui: asked, ...props }: VideoPlayerProps) {
  const [ui, setUi] = useState<Ui>(asked ?? DEFAULT_UI);

  // Адрес читаем после появления страницы: на сервере его нет, и разметка
  // должна совпасть с той, что браузер получил первой.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('player');
    if (fromUrl === 'vidstack' || fromUrl === 'chrome') setUi(fromUrl);
  }, []);

  return ui === 'vidstack' ? <VideoPlayerVidstack {...props} /> : <VideoPlayerChrome {...props} />;
}
