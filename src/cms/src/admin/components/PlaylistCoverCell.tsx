'use client';

import type { DefaultCellComponentProps } from 'payload';

/**
 * Обложка набора в списке наборов.
 *
 * @remarks
 * Наборов у автора десятки, и различает он их по картинке, а не по строке
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
  const cover = typeof row.cover === 'object' && row.cover ? row.cover : null;
  const src = cover?.thumbnailURL ?? cover?.url;

  if (!src) {
    return (
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
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={row.title ?? ''}
      loading="lazy"
      style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 4, display: 'block' }}
    />
  );
}
