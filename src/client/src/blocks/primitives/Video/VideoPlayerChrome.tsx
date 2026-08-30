'use client';

import { createKeyLoader } from './key-loader';
import { useEffect, useRef, useState } from 'react';
import 'media-chrome';
import 'media-chrome/menu';
import 'hls-video-element';

import { cn } from '@/lib/utils';

import { VideoGestures } from './VideoGestures';
import { VideoMiniFrame } from './VideoMiniFrame';
import { useMiniPlayer } from './useMiniPlayer';
import { DEFAULT_RATIO, useVideoRatio } from './useVideoRatio';
import { useVideoResume } from './useVideoResume';

/**
 * Слой управления на media-chrome - первый из двух, между ними переключает флаг.
 *
 * @remarks
 * Клиентский по необходимости (R14): работа с видео, сетью и выбором качества
 * живёт только в браузере.
 *
 * Ничего из органов управления здесь не написано своими руками. Движок —
 * `hls-video-element` (обёртка над `hls.js` от тех же авторов, что и
 * интерфейс), органы — `media-chrome`: перемотка, скорость, качество,
 * громкость, картинка в картинке, полный экран и клавиатура у них готовые и
 * отлаженные.
 *
 * Обёртка выбрана не ради краткости: она отдаёт список качеств потока наружу
 * (`videoRenditions`), и меню качества становится штатным вместо самодельного
 * выпадающего списка. Свою конфигурацию `hls.js` она принимает целиком —
 * поэтому подмена загрузчика ключа остаётся нашей.
 */
export interface VideoPlayerChromeProps {
  /** Адрес master.m3u8. */
  readonly src: string;
  /** Идентификатор медиафайла: по нему запрашивается ключ. */
  readonly mediaId: string | number;
  readonly poster?: string | undefined;
  readonly className?: string | undefined;
  /**
   * Что показать поверх кадра: карточку «дальше», подсказку, что угодно.
   *
   * @remarks
   * Плеер не знает про плейлисты и очередь — это дело того, кто его поставил.
   * Поэтому содержимое приходит снаружи, а сюда попадает только место для него.
   */
  readonly overlay?: React.ReactNode;
  /** Кадр наружу: тому, кто рисует поверх, нужно знать, когда видео кончилось. */
  readonly onVideoRef?: ((video: HTMLVideoElement | null) => void) | undefined;
  /**
   * Переход к соседнему видео плейлиста.
   *
   * @remarks
   * Кнопки стоят на оверлее рядом с паузой — там, где зритель их и ищет.
   * Пусто — значит листать нечего, и кнопка не рисуется.
   */
  readonly onPrev?: (() => void) | undefined;
  readonly onNext?: (() => void) | undefined;
  /** Заголовок для скринридера — у видео без подписи иначе только «video». */
  readonly title?: string | undefined;
  /**
   * Уводить играющую запись уголком, когда страницу прокрутили мимо.
   *
   * @remarks
   * Решает вызывающий: на странице записи уголок уместен, а в блоке посреди
   * длинного текста он перекрывает чтение.
   */
  readonly mini?: boolean;
}

type Phase = 'loading' | 'playing' | 'denied' | 'not-ready' | 'error';

/** Текст отказа. Владелец переопределяет его в настройках сайта. */
const DENIED_TEXT: Record<string, string> = {
  'not-entitled': 'Откроется по коду доступа',
  'not-ready': 'Видео ещё готовится к показу',
};

/**
 * Скорости воспроизведения.
 *
 * @remarks
 * Медленные ступени близко к единице: ими разбирают сложное место в записи,
 * а половинная скорость там уже неразборчива.
 */
const PLAYBACK_RATES = '0.85 0.9 1 1.25 1.5 2';

export function VideoPlayerChrome({
  src,
  mediaId,
  poster,
  className,
  title,
  overlay,
  onVideoRef,
  onPrev,
  onNext,
  mini = false,
}: VideoPlayerChromeProps) {
  const videoRef = useRef<(HTMLVideoElement & { config?: unknown }) | null>(null);
  // Контроллер нужен жестам: у него переключается видимость управления.
  const controllerRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const miniPlayer = useMiniPlayer(frameRef, videoRef);
  const asMini = mini && miniPlayer.active;
  const [phase, setPhase] = useState<Phase>('loading');
  const [reason, setReason] = useState<string>('not-entitled');

  /*
    Кадр держим и ссылкой, и значением: ссылка нужна тем, кому важен сам
    доступ к нему, а значение - тем, кто должен дождаться его появления.
    Форма кадра и память места - как раз вторые.
  */
  const [media, setMedia] = useState<HTMLVideoElement | null>(null);
  const ratio = useVideoRatio(media) ?? DEFAULT_RATIO;
  useVideoResume(media, { mediaId });

  /**
   * Плеер собирается только в браузере.
   *
   * @remarks
   * `media-chrome` и `hls-video` — веб-компоненты: браузер дописывает им свои
   * атрибуты раньше, чем React сверяет разметку, и гидрация падает с
   * «attributes didn't match». Без JS они всё равно не работают, поэтому на
   * сервере остаётся постер.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Загрузчик общий с соседним слоем управления: шифрование одно на оба,
    // и держать его двумя копиями значит однажды починить только одну.
    const loader = createKeyLoader({
      onFailure: (failure) => {
        if (failure === 'error') {
          setPhase('error');
          return;
        }
        setReason(failure);
        setPhase(failure === 'not-ready' ? 'not-ready' : 'denied');
      },
    });

    // Конфигурация уходит в обёртку до источника: она разворачивает её в свой
    // экземпляр hls.js.
    video.config = {
      // Стартуем с нижней ступени: первый кадр появляется быстрее, дальше
      // движок сам поднимется, увидев запас по каналу.
      startLevel: 0,
      loader,
    };
    video.setAttribute('src', src);
    setMedia(video);
    onVideoRef?.(video);
    setPhase('playing');
  }, [src, mediaId, mounted]);

  if (phase === 'denied' || phase === 'not-ready') {
    return (
      <div
        data-part="denied"
        className={cn(
          'flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface text-center',
          className,
        )}
        style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover' } : undefined}
      >
        <p className="text-body font-medium text-ink">
          {DENIED_TEXT[reason] ?? DENIED_TEXT['not-entitled']}
        </p>
      </div>
    );
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
      <VideoMiniFrame
        asMini={asMini}
        onDismiss={miniPlayer.dismiss}
        className="overflow-hidden rounded-xl border border-border bg-black"
      >
        {!mounted ? (
          <video
            poster={poster}
            playsInline
            preload="none"
            title={title}
            className="block h-full w-full"
            style={{ aspectRatio: ratio }}
          />
        ) : (
          /* @ts-expect-error — веб-компоненты media-chrome не типизированы для JSX */
          <media-controller
            ref={controllerRef}
            class="relative block w-full"
            style={{ aspectRatio: ratio }}
          >
            {/*
            Собственную высоту видео не задаём: media-chrome раскладывает слот
            сам и кладёт панель управления поверх нижней кромки кадра. С
            растянутым на всю высоту видео панель оказывалась под кадром
            отдельной полосой — на телефоне это съедало пол-экрана.
          */}
            {/* @ts-expect-error — веб-компонент */}
            <hls-video
              ref={videoRef}
              slot="media"
              poster={poster}
              playsinline
              preload="metadata"
              title={title}
            />
            {/* @ts-expect-error — веб-компонент */}
            <media-settings-menu hidden anchor="auto">
              {/* @ts-expect-error — веб-компонент */}
              <media-settings-menu-item>
                Скорость
                {/* @ts-expect-error — веб-компонент */}
                <media-playback-rate-menu slot="submenu" rates={PLAYBACK_RATES} hidden>
                  <div slot="title">Скорость</div>
                  {/* @ts-expect-error — веб-компонент */}
                </media-playback-rate-menu>
                {/* @ts-expect-error — веб-компонент */}
              </media-settings-menu-item>
              {/* @ts-expect-error — веб-компонент */}
              <media-settings-menu-item>
                Качество
                {/* @ts-expect-error — веб-компонент */}
                <media-rendition-menu slot="submenu" hidden>
                  <div slot="title">Качество</div>
                  {/* @ts-expect-error — веб-компонент */}
                </media-rendition-menu>
                {/* @ts-expect-error — веб-компонент */}
              </media-settings-menu-item>
              {/* @ts-expect-error — веб-компонент */}
            </media-settings-menu>
            {/* Тап по кадру играет и ставит на паузу, двойной по краю перематывает. */}
            <VideoGestures videoRef={videoRef} controllerRef={controllerRef} />

            {/*
            Управление посередине кадра: середина — самая доступная пальцу
            область, а нижние кнопки мелкие, и на ходу в них не попасть.
          */}
            <div slot="centered-chrome" data-part="center" className="video-center">
              <button
                type="button"
                onClick={onPrev}
                disabled={!onPrev}
                aria-label="Предыдущее видео"
                data-part="prev"
                className="video-center__side"
              >
                <PrevIcon />
              </button>

              {/* @ts-expect-error — веб-компонент */}
              <media-play-button />

              <button
                type="button"
                onClick={onNext}
                disabled={!onNext}
                aria-label="Следующее видео"
                data-part="next"
                className="video-center__side"
              >
                <NextIcon />
              </button>
            </div>

            {/*
            Низ плеера — один блок: полоса времени во всю ширину и строка
            управления под ней вплотную, как в мобильных плеерах. Порознь
            между ними просвечивает кадр, и обе части читаются как случайные.
          */}
            <div data-part="controls" className="video-bottom">
              {/* @ts-expect-error — веб-компонент */}
              <media-time-range class="video-progress" />

              {/* @ts-expect-error — веб-компонент */}
              <media-control-bar class="video-bar">
                {/* @ts-expect-error — веб-компонент */}
                <media-time-display showduration />
                {/* @ts-expect-error — веб-компонент */}
                <media-mute-button />
                {/* Ползунок громкости только на широком экране: на телефоне
                  громкость крутят кнопками устройства. */}
                {/* @ts-expect-error — веб-компонент */}
                <media-volume-range class="only-wide" />
                <span className="video-bar-gap" />
                {/* @ts-expect-error — веб-компонент */}
                <media-settings-menu-button />
                {/* @ts-expect-error — веб-компонент */}
                <media-pip-button class="only-wide" />
                {/* @ts-expect-error — веб-компонент */}
                <media-fullscreen-button />
                {/* @ts-expect-error — веб-компонент */}
              </media-control-bar>
            </div>

            {overlay}
            {/* @ts-expect-error — веб-компонент */}
          </media-controller>
        )}
      </VideoMiniFrame>
    </div>
  );
}

function PrevIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 6h2v12H6zM20 6v12l-9-6z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16 6h2v12h-2zM4 6l9 6-9 6z" />
    </svg>
  );
}
