'use client';

import Hls from 'hls.js';
import { useMemo, useState } from 'react';
import {
  isHLSProvider,
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaProviderAdapter,
} from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

import { cn } from '@/lib/utils';

import { createEnvelopeLoader, type EnvelopeFailure } from './envelope-loader';
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
export type VideoPlayerVidstackProps = VideoPlayerChromeProps;

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
}: VideoPlayerVidstackProps) {
  const [denied, setDenied] = useState<EnvelopeFailure | null>(null);

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
    <div className={cn('relative', className)}>
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
          onVideoRef?.((media as HTMLVideoElement) ?? null);
        }}
      >
        <MediaProvider>
          {poster && <Poster className="vds-poster" src={poster} alt="" />}
        </MediaProvider>

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
