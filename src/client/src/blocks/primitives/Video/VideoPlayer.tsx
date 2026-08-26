'use client';

import Hls from 'hls.js';
import { useEffect, useRef, useState } from 'react';
import 'media-chrome';

import { cn } from '@/lib/utils';

/**
 * Плеер потокового видео: качества, перемотка, закрытый доступ.
 *
 * @remarks
 * Клиентский по необходимости (R14): работа с `<video>`, сетью и выбором
 * качества живёт только в браузере.
 *
 * Интерфейс — `media-chrome`, движок — `hls.js`. Своей верстки органов
 * управления здесь нет намеренно: перемотка, громкость, полный экран и
 * клавиатура — это чужая решённая задача, а собственная реализация означала бы
 * собственные же баги в них.
 *
 * Ключ шифрования плеер сам не запрашивает: его загрузчик подменён на наш,
 * который берёт конверт и вскрывает его токеном сессии.
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

export function VideoPlayer({
  src,
  token,
  mediaId,
  cmsUrl,
  poster,
  className,
  title,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [reason, setReason] = useState<string>('sign-in-required');
  const [levels, setLevels] = useState<ReadonlyArray<{ index: number; height: number }>>([]);
  const [current, setCurrent] = useState<number>(-1);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Safari играет HLS сам, без сторонних движков. Там подменить загрузчик
    // ключа нечем, поэтому закрытое видео в этом пути работать не будет —
    // и это осознанно: своего движка ради одного браузера мы не пишем.
    if (!Hls.isSupported()) {
      video.src = src;
      setPhase('playing');
      return;
    }

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

    const hls = new Hls({
      // Стартуем с нижней ступени: первый кадр появляется быстрее, дальше
      // движок сам поднимется, увидев запас по каналу.
      startLevel: 0,
      loader: EnvelopeAwareLoader,
    });

    hls.loadSource(src);
    hls.attachMedia(video);
    hlsRef.current = hls;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      setLevels(hls.levels.map((level, index) => ({ index, height: level.height })));
      setPhase('playing');
    });
    hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => setCurrent(data.level));

    return () => {
      hls.destroy();
      hlsRef.current = null;
    };
  }, [src, token, mediaId, cmsUrl]);

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
      {/* @ts-expect-error — веб-компоненты media-chrome не типизированы для JSX */}
      <media-controller class="block w-full aspect-video">
        <video
          ref={videoRef}
          slot="media"
          poster={poster}
          playsInline
          preload="metadata"
          title={title}
          className="h-full w-full"
        />
        {/* @ts-expect-error — веб-компонент */}
        <media-control-bar>
          {/* @ts-expect-error — веб-компонент */}
          <media-play-button />
          {/* @ts-expect-error — веб-компонент */}
          <media-time-range />
          {/* @ts-expect-error — веб-компонент */}
          <media-time-display showduration />
          {/* @ts-expect-error — веб-компонент */}
          <media-mute-button />
          {/* @ts-expect-error — веб-компонент */}
          <media-volume-range />
          {/* @ts-expect-error — веб-компонент */}
          <media-fullscreen-button />
          {/* @ts-expect-error — веб-компонент */}
        </media-control-bar>
        {/* @ts-expect-error — веб-компонент */}
      </media-controller>

      {levels.length > 1 && (
        <label className="absolute right-3 top-3 flex items-center gap-2 rounded-md bg-black/70 px-2 py-1 text-xs text-white">
          <span className="sr-only">Качество</span>
          <select
            className="bg-transparent outline-none"
            value={current}
            onChange={(event) => {
              const level = Number(event.target.value);
              // -1 возвращает выбор движку: он снова подстраивается под канал.
              if (hlsRef.current) hlsRef.current.currentLevel = level;
              setCurrent(level);
            }}
          >
            <option value={-1}>Авто</option>
            {levels.map((level) => (
              <option key={level.index} value={level.index}>
                {level.height}p
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

/**
 * Вскрывает конверт: возвращает секрет потока для плеера.
 *
 * @remarks
 * Ключ конверта лежит внутри токена сессии — первой его частью. Разбираем её
 * здесь, а не тащим отдельным полем: так в разметке страницы одна строка,
 * которую нельзя случайно раскомплектовать наполовину.
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
