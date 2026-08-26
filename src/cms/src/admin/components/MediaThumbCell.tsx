'use client';

import type { DefaultCellComponentProps } from 'payload';

/**
 * Миниатюра файла в списке медиа.
 *
 * @remarks
 * У видео Payload рисует дефолтную иконку документа: кадр из ролика он вытащить
 * не может, а после нарезки исходника по прежнему адресу и вовсе нет. В списке
 * из десяти таких строк одинаковые серые квадраты, и найти нужный ролик глазами
 * невозможно.
 *
 * Поэтому для видео показываем обложку, которая снялась при нарезке, и она же
 * лежит в поле `preview`. Для картинок ничего не меняем — там штатная
 * миниатюра работает.
 */
type Row = {
  mimeType?: string;
  filename?: string;
  url?: string;
  thumbnailURL?: string;
  preview?: { url?: string } | string | number | null;
};

export function MediaThumbCell({ rowData }: DefaultCellComponentProps) {
  const row = (rowData ?? {}) as Row;

  const isVideo = String(row.mimeType ?? '').startsWith('video/');
  // В списке связь приходит идентификатором, а не документом, поэтому кадр
  // берём из миниатюры: у нарезанного ролика она и есть снятая обложка.
  const preview = typeof row.preview === 'object' && row.preview ? row.preview.url : undefined;
  // У видео `url` ведёт на манифест потока — картинкой он не откроется.
  const src = preview ?? row.thumbnailURL ?? (isVideo ? undefined : row.url);

  if (!src) {
    // Обложки ещё нет: ролик в очереди или нарезка не удалась. Пустая рамка
    // ровно того же размера, чтобы строки в таблице не прыгали.
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
    <img
      src={src}
      alt=""
      loading="lazy"
      style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 4, display: 'block' }}
    />
  );
}
