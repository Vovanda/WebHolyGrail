'use client';

import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';
import 'media-chrome';
import 'media-chrome/menu';
import 'hls-video-element';

import { cn } from '@/lib/utils';

/**
 * Плеер потокового видео: качества, скорость, перемотка, закрытый доступ.
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
export interface VideoPlayerProps {
  /** Адрес master.m3u8. */
  readonly src: string;
  /** Токен сессии зрителя — им вскрывается конверт. */
  readonly token: string;
  /** Идентификатор медиафайла: по нему запрашивается конверт. */
  readonly mediaId: string | number;
  /** Базовый адрес CMS. */
  readonly cmsUrl: string;
  readonly poster?: string | undefined;
  readonly className?: string | undefined;
  /** Заголовок для скринридера — у видео без подписи иначе только «video». */
  readonly title?: string | undefined;
}

type Phase = 'loading' | 'playing' | 'denied' | 'not-ready' | 'error';

/** Текст отказа. Владелец переопределяет его в настройках сайта. */
const DENIED_TEXT: Record<string, string> = {
  'sign-in-required': 'Видео доступно после входа',
  'not-entitled': 'Видео доступно по подписке',
  'not-ready': 'Видео ещё готовится к показу',
};

/**
 * Скорости воспроизведения.
 *
 * @remarks
 * Медленные ступени близко к единице: в уроке ими разбирают сложное место, а
 * половинная скорость там уже неразборчива.
 */
const PLAYBACK_RATES = '0.85 0.9 1 1.25 1.5 2';

export function VideoPlayer({
  src,
  token,
  mediaId,
  cmsUrl,
  poster,
  className,
  title,
}: VideoPlayerProps) {
  const videoRef = useRef<(HTMLVideoElement & { config?: unknown }) | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [reason, setReason] = useState<string>('sign-in-required');

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

    /**
     * Загрузчик с подменой на запросах ключа.
     *
     * @remarks
     * Отдельной точки для ключей у движка нет — есть один загрузчик на все
     * запросы. Поэтому оборачиваем штатный: адрес ключа узнаём по совпадению
     * с эндпоинтом выдачи (он же стоит в плейлисте), всё остальное —
     * плейлисты и сегменты — уходит дальше без изменений, прямо на CDN.
     */
    const envelopeUrl = `${cmsUrl}/api/video/${mediaId}/envelope`;
    const DefaultLoader = Hls.DefaultConfig.loader;

    class EnvelopeAwareLoader extends DefaultLoader {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- контракт загрузчика задан библиотекой
      load(context: any, config: any, callbacks: any): void {
        if (!String(context?.url ?? '').startsWith(envelopeUrl)) {
          super.load(context, config, callbacks);
          return;
        }

        // Куку шлём явно: без неё эндпоинт увидит анонима, и закрытое видео
        // не откроется даже у вошедшего зрителя.
        fetch(`${envelopeUrl}?token=${encodeURIComponent(token)}`, { credentials: 'include' })
          .then(async (response) => {
            if (!response.ok) {
              const body = (await response.json().catch(() => ({}))) as { error?: string };
              throw new Error(body.error ?? String(response.status));
            }
            const { envelope } = (await response.json()) as { envelope: string };
            return openEnvelope(envelope, token);
          })
          .then((key) => {
            callbacks.onSuccess(
              { url: context.url, data: key },
              { code: 200, text: '' },
              context,
              null,
            );
          })
          .catch((error: Error) => {
            const known = ['sign-in-required', 'not-entitled', 'not-ready'];
            if (known.includes(error.message)) {
              setReason(error.message);
              setPhase(error.message === 'not-ready' ? 'not-ready' : 'denied');
            } else {
              setPhase('error');
            }
            callbacks.onError({ code: 403, text: error.message }, context, null, {});
          });
      }
    }

    // Конфигурация уходит в обёртку до источника: она разворачивает её в свой
    // экземпляр hls.js.
    video.config = {
      // Стартуем с нижней ступени: первый кадр появляется быстрее, дальше
      // движок сам поднимется, увидев запас по каналу.
      startLevel: 0,
      loader: EnvelopeAwareLoader,
    };
    video.setAttribute('src', src);
    setPhase('playing');
  }, [src, token, mediaId, cmsUrl, mounted]);

  if (phase === 'denied' || phase === 'not-ready') {
    return (
      <div
        className={cn(
          'flex aspect-video flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface text-center',
          className,
        )}
        style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover' } : undefined}
      >
        <p className="text-body font-medium text-ink">
          {DENIED_TEXT[reason] ?? DENIED_TEXT['sign-in-required']}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border border-border bg-black', className)}
    >
      {!mounted ? (
        <video
          poster={poster}
          playsInline
          preload="none"
          title={title}
          className="block aspect-video h-full w-full"
        />
      ) : (
        /* @ts-expect-error — веб-компоненты media-chrome не типизированы для JSX */
        <media-controller class="block w-full aspect-video">
          {/* @ts-expect-error — веб-компонент */}
          <hls-video
            ref={videoRef}
            slot="media"
            poster={poster}
            playsinline
            preload="metadata"
            title={title}
            class="h-full w-full"
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
          {/* @ts-expect-error — веб-компонент */}
          <media-control-bar>
            {/* @ts-expect-error — веб-компонент */}
            <media-play-button />
            {/* @ts-expect-error — веб-компонент */}
            <media-seek-backward-button seekoffset="10" />
            {/* @ts-expect-error — веб-компонент */}
            <media-seek-forward-button seekoffset="10" />
            {/* @ts-expect-error — веб-компонент */}
            <media-time-range />
            {/* @ts-expect-error — веб-компонент */}
            <media-time-display showduration />
            {/* @ts-expect-error — веб-компонент */}
            <media-mute-button />
            {/* @ts-expect-error — веб-компонент */}
            <media-volume-range />
            {/* @ts-expect-error — веб-компонент */}
            <media-settings-menu-button />
            {/* @ts-expect-error — веб-компонент */}
            <media-pip-button />
            {/* @ts-expect-error — веб-компонент */}
            <media-fullscreen-button />
            {/* @ts-expect-error — веб-компонент */}
          </media-control-bar>
          {/* @ts-expect-error — веб-компонент */}
        </media-controller>
      )}
    </div>
  );
}

/**
 * Вскрывает конверт ключом из токена зрителя.
 *
 * @remarks
 * Ключ лежит в самом токене и отдельно нигде не хранится: сервер собирает его
 * при проверке подписи, браузер берёт из своей же строки.
 */
async function openEnvelope(envelope: string, token: string): Promise<ArrayBuffer> {
  const [rawKey] = token.split('.');
  const key = await crypto.subtle.importKey(
    'raw',
    base64urlToBytes(rawKey ?? ''),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );
  const [iv, sealed, tag] = envelope.split('.') as [string, string, string];
  // WebCrypto ждёт метку подлинности приклеенной к шифротексту, а Node отдаёт
  // её отдельно — склеиваем здесь.
  const sealedBytes = new Uint8Array(base64urlToBytes(sealed));
  const tagBytes = new Uint8Array(base64urlToBytes(tag));
  const payload = new Uint8Array(sealedBytes.length + tagBytes.length);
  payload.set(sealedBytes);
  payload.set(tagBytes, sealedBytes.length);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64urlToBytes(iv) }, key, payload);
}

function base64urlToBytes(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
