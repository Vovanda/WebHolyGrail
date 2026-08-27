'use client';

import { useEffect, useState } from 'react';

import type {
  VideoChapter,
  VideoDeniedSettings,
  VideoStoryboard,
  VideoSubtitleTrack,
} from 'contracts';

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
 * Значение приходит переключателем `video.layout.vendor`, поэтому меняется в
 * админке без выкладки и задаётся отдельно для пробного и рабочего сайта.
 * Поверх него работает `?player=` в адресе - им можно посмотреть оба варианта
 * на одной странице подряд, ничего не переключая для остальных.
 */
export type VideoPlayerProps = VideoPlayerChromeProps & {
  /** Дорожки субтитров: показывает только новый слой управления. */
  readonly subtitles?: ReadonlyArray<VideoSubtitleTrack> | undefined;
  /** Оглавление записи: показывает только новый слой управления. */
  readonly chapters?: ReadonlyArray<VideoChapter> | undefined;
  readonly durationSeconds?: number | null | undefined;
  /** Уводить играющую запись уголком при прокрутке: показывает только новый слой. */
  readonly mini?: boolean;
  /** Кадры для перемотки: показывает только новый слой управления. */
  readonly storyboard?: VideoStoryboard | null | undefined;
  /** Что показать вместо закрытой записи: задаётся владельцем в настройках. */
  readonly deniedSettings?: VideoDeniedSettings | undefined;
  /** Подпись зрителя поверх кадра: показывает только новый слой управления. */
  readonly watermark?: string | undefined;
  /**
   * Какой слой управления рисовать.
   *
   * @remarks
   * Приходит переключателем, поэтому владелец меняет его в админке без
   * выкладки. Адрес перекрывает это значение: так можно посмотреть второй
   * вариант, ничего не переключая для остальных.
   */
  readonly ui?: 'vidstack' | 'chrome' | undefined;
};

type Ui = 'chrome' | 'vidstack';

/**
 * Слой на случай, когда сверху ничего не передали.
 *
 * @remarks
 * Выбор приходит переключателем `video.layout.vendor`, а здесь остаётся запасное
 * значение для страниц, которые свод не читают. Раньше на его месте была
 * переменная сборки: она вшивается при сборке, и «включить без выкладки» через
 * неё не работало - это и подтолкнуло завести переключатели.
 */
const DEFAULT_UI: Ui = 'vidstack';

export function VideoPlayer({ ui: asked, ...props }: VideoPlayerProps) {
  const [ui, setUi] = useState<Ui>(asked ?? DEFAULT_UI);

  // Адрес читаем после появления страницы: на сервере его нет, и разметка
  // должна совпасть с той, что браузер получил первой.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('player');
    if (fromUrl === 'vidstack' || fromUrl === 'chrome') setUi(fromUrl);
  }, []);

  // Прежний слой субтитров не рисует: он остаётся для сравнения и уйдёт, когда
  // выбор устоится.
  const {
    subtitles,
    chapters,
    durationSeconds,
    mini,
    storyboard,
    deniedSettings,
    watermark,
    ...common
  } = props;
  return ui === 'vidstack' ? (
    <VideoPlayerVidstack
      {...common}
      subtitles={subtitles}
      chapters={chapters}
      durationSeconds={durationSeconds}
      mini={mini ?? false}
      storyboard={storyboard}
      deniedSettings={deniedSettings}
      watermark={watermark}
    />
  ) : (
    <VideoPlayerChrome {...common} />
  );
}
