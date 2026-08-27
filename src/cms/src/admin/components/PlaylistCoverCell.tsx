'use client';

import type { DefaultCellComponentProps } from 'payload';

import { useRelatedImageURL } from './useRelatedImageURL';

/**
 * Обложка плейлиста в списке плейлистов.
 *
 * @remarks
 * Плейлистов у автора десятки, и различает он их по картинке, а не по строке
 * названия: «Курс, часть вторая» и «Курс, часть третья» глазами не отличаются.
 *
 * Рамка рисуется и без обложки: иначе строки таблицы прыгают по высоте.
 */
interface Row {
  cover?: { url?: string; thumbnailURL?: string } | number | string | null;
  title?: string;
}

export function PlaylistCoverCell({ rowData }: DefaultCellComponentProps) {
  const row = (rowData ?? {}) as Row;
  const src = useRelatedImageURL('media', row.cover);

  return (
    <>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={row.title ?? ''}
          loading="lazy"
          style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 4, display: 'block' }}
        />
      ) : (
        <span
          aria-hidden="true"
          style={{
            display: 'block',
            width: 60,
            height: 34,
            borderRadius: 4,
            background: 'var(--theme-elevation-100)',
          }}
        />
      )}
    </>
  );
}
