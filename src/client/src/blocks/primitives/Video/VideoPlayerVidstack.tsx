'use client';

import Hls from 'hls.js';
import { useEffect, useMemo, useRef, useState } from 'react';
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

import type {
  VideoChapter,
  VideoDeniedSettings,
  VideoStoryboard,
  VideoSubtitleTrack,
} from 'contracts';

import { cn } from '@/lib/utils';

import { chaptersTrackUrl } from './chapters-track';
import { watchSoloPlayback } from './solo-playback';
import { VideoDenied } from './VideoDenied';
import { VideoMiniFrame } from './VideoMiniFrame';
import { VideoWatermark } from './VideoWatermark';
import { storyboardTrackUrl } from './storyboard-track';
import { useMiniPlayer } from './useMiniPlayer';
import { createKeyLoader, type KeyFailure } from './key-loader';
import { useVideoResume } from './useVideoResume';
import { DEFAULT_RATIO, useVideoRatio } from './useVideoRatio';
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
 * `key-loader`: сам плеер о закрытом доступе ничего не знает, ему отдают
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
  /** Кадры для перемотки: полоса времени показывает кадр под курсором. */
  readonly storyboard?: VideoStoryboard | null | undefined;
  /** Что показать вместо закрытой записи: задаётся владельцем в настройках. */
  readonly deniedSettings?: VideoDeniedSettings | undefined;
  /**
   * Подпись зрителя поверх кадра.
   *
   * @remarks
   * Ставится на закрытые записи: слив тогда приводит прямо к сливающему.
   * Открытую портить посторонним текстом незачем.
   */
  readonly watermark?: string | undefined;
};

export function VideoPlayerVidstack({
  src,
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
  storyboard = null,
  deniedSettings,
  watermark,
}: VideoPlayerVidstackProps) {
  const [denied, setDenied] = useState<KeyFailure | null>(null);

  /*
    Ссылка вида `?t=3m20s` открывает видео с нужного места, а без неё оно
    продолжается там, где его оставили.

    Кадр держим и ссылкой, и значением: ссылка нужна соседям, которым важен
    только доступ к нему, а значение - тем, кто должен дождаться его появления.
    Плеер создаёт кадр не сразу, и без этого перемотка молча терялась.
  */
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [media, setMedia] = useState<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const miniPlayer = useMiniPlayer(frameRef, videoRef);
  const asMini = mini && miniPlayer.active;
  useVideoTimecode(media);
  useVideoResume(media, { mediaId });
  // Форма кадра общая с соседним слоем: вертикальная запись не должна
  // растягиваться поперёк себя ни в одном из них.
  const ratio = useVideoRatio(media);

  // Оглавление собирается дорожкой прямо здесь: файла на диске не появляется.
  const chaptersUrl = useMemo(
    () => chaptersTrackUrl(chapters, durationSeconds),
    [chapters, durationSeconds],
  );

  // Подсказки на полосе времени: кадры лежат одной картинкой, разметка к ней
  // собирается здесь же.
  const thumbnails = useMemo(() => storyboardTrackUrl(storyboard), [storyboard]);

  // Загрузчик один на всё время просмотра: он узнаёт запрос ключа по виду
  // адреса, а не по номеру видео, поэтому переход к следующему его не трогает.
  const loader = useMemo(() => createKeyLoader({ onFailure: setDenied }), []);

  // Отказ прошлого видео к следующему не относится: без сброса зритель увидел
  // бы заглушку там, где всё открыто.
  useEffect(() => {
    setDenied(null);
  }, [mediaId]);

  /*
    Новая запись начинается сначала и сразу играет. Плеер один на всю подборку,
    меняется только поток: движок при смене источника ни позицию не сбрасывает,
    ни воспроизведение не начинает - следующая запись продолжала с секунды
    предыдущей и ждала ещё одного нажатия.

    Первую запись не трогаем: там жеста зрителя ещё не было, и браузер запуск
    всё равно не пустит. Своё место, если оно сохранено, вернётся дальше -
    возврат идёт по готовности метаданных, уже после этого сброса.
  */
  /*
    На странице играет один: запуск любого плеера останавливает остальные.
    Слежение общее на весь документ, поэтому каждый плеер ставит его себе -
    лишние снимаются вместе со своими плеерами, а последний уносит слушателя.
  */
  useEffect(() => watchSoloPlayback(), []);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!media) return;
    media.currentTime = 0;
    if (!startedRef.current) {
      startedRef.current = true;
      return;
    }
    void media.play().catch(() => {
      // Браузер вправе отказать - тогда зритель нажмёт сам, и это не поломка.
    });
  }, [media, mediaId]);

  if (denied && denied !== 'error') {
    return (
      <VideoDenied
        reason={denied}
        settings={deniedSettings}
        poster={poster}
        className={className}
      />
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
      data-part="player"
      className={cn(
        'relative',
        // Место записи на странице остаётся занятым: без этого страница
        // подпрыгивает, стоит кадру уехать в угол.
        asMini && 'min-h-[1px]',
        className,
      )}
    >
      <VideoMiniFrame asMini={asMini} onDismiss={miniPlayer.dismiss}>
        <MediaPlayer
          data-part="frame"
          className="video-vidstack w-full overflow-hidden rounded-xl border border-border"
          aspectRatio={ratio ?? DEFAULT_RATIO}
          src={{ src, type: 'application/x-mpegurl' }}
          title={title ?? ''}
          playsInline
          crossOrigin
          keyTarget="player"
          onProviderChange={onProviderChange}
          onCanPlay={(_detail, event) => {
            const found =
              ((event.target as { el?: HTMLElement } | null)?.el?.querySelector(
                'video',
              ) as HTMLVideoElement | null) ?? null;

            videoRef.current = found;
            setMedia(found);
            onVideoRef?.(found);
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
          <DefaultVideoLayout
            icons={defaultLayoutIcons}
            translations={RU}
            /*
              На узком экране плеер по умолчанию поднимает меню настроек
              отдельной панелью снизу окна - вне самого плеера. Оно оказывается
              далеко от шестерёнки, которой его вызвали, и читается как чужое
              окно поверх страницы. Открываем меню там же, где кнопка.
            */
            noModal
            {...(thumbnails ? { thumbnails } : {})}
          />
        </MediaPlayer>

        {/* Переход по плейлисту: у готового слоя таких кнопок нет, ставим поверх кадра. */}
        {(onPrev || onNext) && (
          <div data-part="set-nav" className="video-vidstack__set">
            <button type="button" onClick={onPrev} disabled={!onPrev} aria-label="Предыдущее видео">
              <PrevIcon />
            </button>
            <button type="button" onClick={onNext} disabled={!onNext} aria-label="Следующее видео">
              <NextIcon />
            </button>
          </div>
        )}

        {watermark && <VideoWatermark label={watermark} />}

        {overlay}
      </VideoMiniFrame>
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
  // Кнопки, которые библиотека подписывает по-своему: на живом сайте они
  // оставались единственными английскими словами среди русских.
  PiP: 'Отдельным окном',
  Fullscreen: 'Во весь экран',
  AirPlay: 'Трансляция на устройство',
  'Google Cast': 'Трансляция на телевизор',
  // Библиотека склеивает название кнопки и состояние в одну строку, поэтому
  // состояние пишется так, чтобы читалось продолжением: «Трансляция на
  // телевизор - нет связи».
  Connected: '- связь есть',
  Disconnected: '- нет связи',
  Connecting: '- связывается',
  'Seek:': 'Перемотка:',
  Continue: 'Продолжить',
  Replay: 'Сначала',
  Announcements: 'Объявления',
  'Font Styles': 'Шрифт субтитров',
  'Text Background': 'Фон текста',
  'Display Background': 'Фон поля',
  Size: 'Размер',
  Color: 'Цвет',
  Opacity: 'Прозрачность',
  Reset: 'Сбросить',
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
