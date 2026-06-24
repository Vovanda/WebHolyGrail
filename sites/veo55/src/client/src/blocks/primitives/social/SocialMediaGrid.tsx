'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SocialPostMedia } from '@veo55/contracts';
import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { RowsPhotoAlbum, type Photo } from 'react-photo-album';
import 'react-photo-album/rows.css';

import { cn } from '@/lib/utils';

/**
 * SocialMediaGrid — VK-style mixed photo+video grid через `react-photo-album`.
 *
 * @remarks
 * Раньше: hardcoded grid n1..n6 со square-cropping → пустые блоки + crop вертикальных
 * фоток + не учитывала aspect ratio.
 *
 * Теперь: «тетрис» через `react-photo-album` (rows layout — distributes по строкам так
 * что sum(aspect) ≈ target row aspect, нормализуется на full width). Первая фотка
 * получает удвоенную target-height — становится «героем поста».
 *
 * Video — рендерится тем же layout'ом, но с play-overlay и длительностью через
 * `render.extras`. Lightbox (yet-another-react-lightbox) переключается на VK iframe
 * для video-слайдов.
 *
 * Client component — onClick → lightbox.
 */
type PhotoExt = Photo & {
  isVideo?: boolean;
  duration?: number | undefined;
  title?: string | undefined;
  originalIndex: number;
};

export function SocialMediaGrid({
  media,
  groupId,
}: {
  readonly media: readonly SocialPostMedia[];
  readonly groupId?: string;
}) {
  const [index, setIndex] = useState<number | null>(null);
  const isOpen = index !== null;
  const gid = groupId ?? `media-${media[0]?.url?.slice(-12) ?? 'x'}`;

  // Album photos (для всех media — фото и видео). originalIndex — чтобы при клике
  // открыть правильный slide в lightbox.
  const photos = useMemo<PhotoExt[]>(
    () =>
      media.map((m, i): PhotoExt => {
        const w = m.width && m.width > 0 ? m.width : 800;
        const h = m.height && m.height > 0 ? m.height : m.type === 'video' ? 450 : 600;
        return {
          src: m.url,
          width: w,
          height: h,
          alt: m.type === 'video' ? (m.title ?? 'Видео') : 'Фото к посту',
          isVideo: m.type === 'video',
          duration: m.duration,
          title: m.title,
          originalIndex: i,
        };
      }),
    [media],
  );

  // Lightbox slides — фото обычные, видео — iframe.
  const slides = useMemo<Slide[]>(
    () =>
      media.map((m): Slide => {
        if (m.type === 'video') {
          return {
            type: 'iframe-embed',
            src: m.embedUrl ?? m.url,
            title: m.title,
          } as unknown as Slide;
        }
        return {
          src: m.url,
          width: m.width,
          height: m.height,
        } as Slide;
      }),
    [media],
  );

  const open = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(media.length - 1, i));
      setIndex(clamped);
      try {
        window.history.pushState(
          { lb: gid, i: clamped },
          '',
          `#lb=${encodeURIComponent(gid)}/${clamped}`,
        );
      } catch {
        /* SSR */
      }
    },
    [media.length, gid],
  );

  const close = useCallback(() => {
    setIndex(null);
    try {
      if (window.location.hash.startsWith('#lb=')) window.history.back();
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    function onPop() {
      const m = window.location.hash.match(/^#lb=([^/]+)\/(\d+)$/);
      if (!m || decodeURIComponent(m[1] ?? '') !== gid) setIndex(null);
      else {
        const i = Number(m[2]);
        if (Number.isFinite(i)) setIndex(i);
      }
    }
    onPop();
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [gid]);

  function onIndexChange(i: number) {
    setIndex(i);
    try {
      window.history.replaceState({ lb: gid, i }, '', `#lb=${encodeURIComponent(gid)}/${i}`);
    } catch {
      /* */
    }
  }

  if (media.length === 0) return null;

  return (
    <>
      <div className="bg-[#F3EFE7] rounded-[2px] overflow-hidden">
        <RowsPhotoAlbum
          photos={photos}
          // 240px target row height — компактно, видно много, видео-аспект не теряется.
          // На мобиле RowsPhotoAlbum сам уменьшит в proportion из-за breakpoints.
          targetRowHeight={240}
          rowConstraints={{ minPhotos: 1, maxPhotos: 4 }}
          spacing={2}
          onClick={({ photo }) => open((photo as PhotoExt).originalIndex)}
          render={{
            extras: (_, { photo }) => {
              const p = photo as PhotoExt;
              if (!p.isVideo) return null;
              return <VideoOverlay duration={p.duration} title={p.title} />;
            },
          }}
        />
      </div>

      <Lightbox
        open={isOpen}
        close={close}
        slides={slides}
        index={index ?? 0}
        on={{ view: ({ index: i }) => onIndexChange(i) }}
        plugins={[Zoom, Counter]}
        counter={{ container: { style: { top: 'unset', bottom: 16, left: 16 } } }}
        zoom={{ maxZoomPixelRatio: 3, doubleTapDelay: 250 }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        styles={{
          container: { backgroundColor: 'rgba(28, 22, 16, 0.92)' },
          toolbar: { top: 0, right: 0, padding: '0.5rem 1rem' },
        }}
        render={{
          slide: ({ slide }) => {
            if ((slide as unknown as { type?: string }).type === 'iframe-embed') {
              const s = slide as unknown as { src: string; title?: string };
              return (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <iframe
                    src={s.src}
                    title={s.title ?? 'Видео'}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full max-w-[1280px] aspect-video bg-black"
                  />
                </div>
              );
            }
            return undefined;
          },
        }}
      />
    </>
  );
}

function VideoOverlay({
  duration,
  title: _title,
}: {
  duration?: number | undefined;
  title?: string | undefined;
}) {
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'flex items-center justify-center rounded-full bg-black/70',
          'border-2 border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.4)]',
          'w-[56px] h-[56px]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'block w-0 h-0',
            'ml-[5px] border-l-[16px] border-t-[10px] border-b-[10px]',
            'border-l-white border-t-transparent border-b-transparent',
          )}
        />
      </span>
      {duration ? (
        <span className="pointer-events-none absolute right-2 bottom-2 px-2 py-px rounded bg-black/75 text-white text-xs font-semibold font-sans leading-snug">
          {formatDuration(duration)}
        </span>
      ) : null}
    </>
  );
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}
