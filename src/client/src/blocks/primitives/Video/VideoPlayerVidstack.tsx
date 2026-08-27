'use client';

import Hls from 'hls.js';
import { useMemo, useRef, useState } from 'react';
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  type MediaProviderAdapter,
} from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import type { VideoChapter, VideoSubtitleTrack } from 'contracts';

import { cn } from '@/lib/utils';

import { chaptersTrackUrl } from './chapters-track';
import { useMiniPlayer } from './useMiniPlayer';
import { createEnvelopeLoader, type EnvelopeFailure } from './envelope-loader';
import { useVideoResume } from './useVideoResume';
import { useVideoTimecode } from './useVideoTimecode';
import type { VideoPlayerChromeProps } from './VideoPlayerChrome';

/**
 * Слой управления на Vidstack - второй из двух, между ними переключает флаг.
 *
 * @remarks
 * Готовый слой управления вместо собранного вручную: перемотка кадрами,
 * субтитры, главы, клавиатура и поведение на телефоне приходят из библиотеки
 * и поддерживаются её авторами.
 *
 * Работа с ключом шифрования общая с первым вариантом и лежит в
 * `envelope-loader`: сам плеер о закрытом доступе ничего не знает, ему отдают
 * настроенный загрузчик hls.js.
 *
 * Библиотеку hls.js передаём свою. По умолчанию Vidstack тянет её из чужой
 * сети раздачи, а нам нужен тот же экземпляр, куда встроен загрузчик ключа.
 */
export type VideoPlayerVidstackProps = VideoPlayerChromeProps & {
  /** Дорожки субтитров: язык, подпись и файл. */
  readonly subtitles?: ReadonlyArray<VideoSubtitleTrack> | undefined;
  /** Оглавление: полоса времени делится на части с подписями. */
  readonly chapters?: ReadonlyArray<VideoChapter> | undefined;
  /** Длительность записи: по ней тянется последняя глава. */
  readonly durationSeconds?: number | null | undefined;
  /**
   * Уводить играющую запись уголком, когда страницу прокрутили мимо.
   *
   * @remarks
   * Уместно там, где под записью есть что читать. В ленте одинаковых карточек
   * от этого только мельтешение, поэтому включается по месту.
   */
  readonly mini?: boolean;
};

/** Текст отказа. Владелец переопределяет его в настройках сайта. */
const DENIED_TEXT: Record<string, string> = {
  'sign-in-required': 'Откроется по коду доступа',
  'not-entitled': 'Откроется по коду доступа',
  'not-ready': 'Видео ещё готовится к показу',
};

export function VideoPlayerVidstack({
  src,
  token,
  mediaId,
  poster,
  className,
  title,
  overlay,
  onVideoRef,
  onPrev,
  onNext,
  subtitles = [],
  chapters = [],
  durationSeconds = null,
  mini = false,
}: VideoPlayerVidstackProps) {
  const [denied, setDenied] = useState<EnvelopeFailure | null>(null);

  // Ссылка вида `?t=3m20s` открывает запись с нужного места, а без неё запись
  // продолжается с того места, где её оставили.
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const miniPlayer = useMiniPlayer(frameRef, videoRef);
  const asMini = mini && miniPlayer.active;
  useVideoTimecode(videoRef);
  useVideoResume(videoRef, { mediaId });

  // Оглавление собирается дорожкой прямо здесь: файла на диске не появляется.
  const chaptersUrl = useMemo(
    () => chaptersTrackUrl(chapters, durationSeconds),
    [chapters, durationSeconds],
  );

  const loader = useMemo(
    () => createEnvelopeLoader({ mediaId, token, onFailure: setDenied }),
    [mediaId, token],
  );

  if (denied && denied !== 'error') {
    return (
      <div
        className={cn(
          'flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface text-center',
          className,
        )}
        style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover' } : undefined}
      >
        <p className="text-body font-medium text-ink">{DENIED_TEXT[denied]}</p>
      </div>
    );
  }

  function onProviderChange(provider: MediaProviderAdapter | null) {
    if (!isHLSProvider(provider)) return;
    provider.library = Hls;
    provider.config = {
      // Стартуем с нижней ступени: первый кадр появляется быстрее, дальше
      // движок сам поднимется, увидев запас по каналу.
      startLevel: 0,
      loader,
    };
  }

  return (
    <div
      ref={frameRef}
      className={cn(
        'relative',
        // Место записи на странице остаётся занятым: без этого страница
        // подпрыгивает, стоит кадру уехать в угол.
        asMini && 'min-h-[1px]',
        className,
      )}
    >
      {asMini && (
        <button
          type="button"
          onClick={miniPlayer.dismiss}
          aria-label="Убрать окошко"
          className="fixed bottom-2 right-2 z-[61] grid h-7 w-7 place-items-center rounded-full bg-ink/80 text-paper"
        >
          ×
        </button>
      )}

      <div className={cn(asMini && 'video-mini')}>
        <MediaPlayer
          className="video-vidstack w-full overflow-hidden rounded-xl border border-border"
          src={{ src, type: 'application/x-mpegurl' }}
          title={title ?? ''}
          playsInline
          crossOrigin
          keyTarget="player"
          onProviderChange={onProviderChange}
          onCanPlay={(_detail, event) => {
            const media = (event.target as { el?: HTMLElement } | null)?.el?.querySelector('video');
            videoRef.current = (media as HTMLVideoElement) ?? null;
            onVideoRef?.((media as HTMLVideoElement) ?? null);
          }}
        >
          <MediaProvider>
            {poster && <Poster className="vds-poster" src={poster} alt="" />}

            {/*
            Дорожки субтитров. Нужны слабослышащим и тем, кто не владеет языком
            записи, а ещё там, где звук включить нельзя - в транспорте, рядом со
            спящим ребёнком.
          */}
            {chaptersUrl && <Track src={chaptersUrl} kind="chapters" lang="ru" default />}

            {subtitles.map((track) => (
              <Track
                key={`${track.language}-${track.src}`}
                src={track.src}
                kind="subtitles"
                label={track.label}
                lang={track.language}
                default={track.default === true}
              />
            ))}
          </MediaProvider>

          {/*
          Раскладку выбирает сама библиотека: у неё свои виды для широкого и
          узкого экрана, и подмена одного другим разносит кнопки по кадру.
        */}
          <DefaultVideoLayout icons={defaultLayoutIcons} translations={RU} />
        </MediaPlayer>

        {/* Переход по набору: у готового слоя таких кнопок нет, ставим поверх кадра. */}
        {(onPrev || onNext) && (
          <div className="video-vidstack__set">
            <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Предыдущее видео">
              <PrevIcon />
            </button>
            <button type="button" onClick={onNext} disabled={!onNext} aria-label="Следующее видео">
              <NextIcon />
            </button>
          </div>
        )}

        {overlay}
      </div>
    </div>
  );
}

/** Подписи слоя управления. Библиотека идёт с английскими. */
const RU: Record<string, string> = {
  Play: 'Смотреть',
  Pause: 'Пауза',
  Mute: 'Выключить звук',
  Unmute: 'Включить звук',
  Volume: 'Громкость',
  Settings: 'Настройки',
  Quality: 'Качество',
  Speed: 'Скорость',
  Normal: 'Обычная',
  Auto: 'Само',
  Captions: 'Субтитры',
  'Closed-Captions On': 'Субтитры включены',
  'Closed-Captions Off': 'Субтитры выключены',
  'Enter Fullscreen': 'Во весь экран',
  'Exit Fullscreen': 'Выйти из полного экрана',
  'Enter PiP': 'Отдельным окном',
  'Exit PiP': 'Вернуть в страницу',
  'Seek Forward': 'Вперёд',
  'Seek Backward': 'Назад',
  'Current Time': 'Сейчас',
  Duration: 'Длительность',
  LIVE: 'Прямой эфир',
  Chapters: 'Главы',
  Accessibility: 'Доступность',
  'Keyboard Animations': 'Подсказки клавиш',
  Off: 'Выключено',
  Default: 'Обычное',
  Audio: 'Звук',
};

function PrevIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zM20 6v12l-9-6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 6h2v12h-2zM4 6l9 6-9 6z" />
    </svg>
  );
}
