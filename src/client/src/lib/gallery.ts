import type { MediaDoc, MediaRef } from 'contracts';

/**
 * Кадр галереи: файл медиатеки и подпись под ним.
 *
 * @remarks
 * Подпись берётся у самого файла - та же, что в ленте при открытии. Своего
 * текста у кадра в галерее нет: править подпись в одном месте проще, чем
 * в каждой галерее, где снимок стоит.
 */
export interface GalleryFrame {
  readonly file: MediaDoc;
  readonly caption?: string;
}

function isDoc(ref: MediaRef | null | undefined): ref is MediaDoc {
  return Boolean(ref) && typeof ref === 'object';
}

/**
 * Кадры в порядке, заданном владельцем.
 *
 * @remarks
 * Голый номер вместо документа - файл не раскрылся при чтении страницы,
 * показывать нечего; такой кадр пропускается, а не ломает ряд.
 *
 * Не список вместо списка - данные блока испорчены (записаны мимо схемы).
 * Галерея тогда пустая, а не роняет всю страницу.
 */
export function galleryFrames(files: unknown): GalleryFrame[] {
  if (!Array.isArray(files)) return [];
  return (files as readonly (MediaRef | null | undefined)[]).filter(isDoc).map((file) => {
    const caption = file.caption?.trim();
    return caption ? { file, caption } : { file };
  });
}

/** Запись отличается от снимка типом файла: показывать её надо иначе. */
export function isRecording(frame: GalleryFrame): boolean {
  return (frame.file.mimeType ?? '').startsWith('video/');
}
