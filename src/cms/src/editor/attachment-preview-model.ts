import { fileKindOf, frameAspectOf, type FrameAspect } from 'contracts';

import { formatBytes } from '../lib/bytes';

/**
 * Что показывает вложение в тексте статьи вместо формы блока.
 *
 * @remarks
 * Здесь только счёт: из значений полей блока и документов медиатеки
 * собирается то, что увидит читатель, - кадры, кадр записи, строки
 * документов. Ни браузера, ни Payload, поэтому всё проверяется тестом.
 */

/** Документ медиатеки в том виде, в каком его отдаёт API. */
export interface MediaCard {
  readonly id: number | string;
  readonly url?: string | null;
  readonly thumbnailURL?: string | null;
  readonly filename?: string | null;
  readonly filesize?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly caption?: string | null;
  readonly mimeType?: string | null;
  /** Кадр первой страницы документа. */
  readonly previewUrl?: string | null;
  readonly sizes?: Record<string, { readonly url?: string | null } | undefined> | null;
}

/** Виды галереи - те же, что у поля `view` блока и на сайте. */
export type GalleryView = 'tiles' | 'carousel' | 'list';
/** Виды списка документов - поле `layout` блока. */
export type DocumentsLayout = 'cards' | 'list';

export interface PreviewFrame {
  readonly id: string;
  readonly src: string;
  /** Форма кадра, как на сайте: подряд - 16:9 или 9:16, иначе форма снимка. */
  readonly aspect: FrameAspect | undefined;
}

export interface PreviewDocument {
  readonly id: string;
  readonly name: string;
  readonly size: string;
  /** Тип словом, как в карточке сайта: «PDF», «изображение». */
  readonly type: string;
  /** Кадр первой страницы, если он снят. */
  readonly thumb: string | null;
}

export type AttachmentPreview =
  | {
      readonly kind: 'frames';
      readonly layout: GalleryView;
      readonly frames: readonly PreviewFrame[];
    }
  | {
      readonly kind: 'recording';
      readonly poster: string | null;
      readonly title: string;
      /** Во всю ширину листа, а не строкой текста. */
      readonly wide: boolean;
    }
  | {
      readonly kind: 'documents';
      readonly layout: DocumentsLayout;
      readonly rows: readonly PreviewDocument[];
    }
  /** Файл ещё не выбран: превью зовёт выбрать. */
  | { readonly kind: 'empty'; readonly hint: string; readonly action: string }
  /** Файл выбран, документ ещё идёт по сети. */
  | { readonly kind: 'loading' };

const LOADING: AttachmentPreview = { kind: 'loading' };
const MISSING: AttachmentPreview = {
  kind: 'empty',
  hint: 'Файл не найден в медиатеке',
  action: 'Выбрать другой',
};

/**
 * Документы медиатеки: `null`, пока ответа нет.
 *
 * @remarks
 * Ответ без нужного файла - не загрузка: файл удалили из медиатеки, и ждать
 * его бесполезно.
 */
export type LoadedCards = readonly MediaCard[] | null;

/**
 * Значение поля выбора или умолчание поля.
 *
 * @remarks
 * Умолчания те же, что у самих полей блока: пустое значение у блока,
 * вставленного до появления поля, сайт читает так же.
 */
function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

const GALLERY_VIEWS: readonly GalleryView[] = ['tiles', 'carousel', 'list'];
const DOCUMENTS_LAYOUTS: readonly DocumentsLayout[] = ['cards', 'list'];

/** Номер записи из значения поля: оно приходит то номером, то документом. */
export function relationKey(value: unknown): string | null {
  const id = typeof value === 'object' && value !== null ? (value as { id?: unknown }).id : value;
  return typeof id === 'number' || (typeof id === 'string' && id !== '') ? String(id) : null;
}

/** Номера записей из поля со многими файлами. */
export function relationKeys(value: unknown): string[] {
  const list = Array.isArray(value) ? value : [];
  return list.map(relationKey).filter((key): key is string => key !== null);
}

/**
 * Значения поля в строках массива, по порядку строк.
 *
 * @remarks
 * Форма хранит строки плоско: `items.0.file`, `items.1.file`. Порядок берётся
 * по номеру строки, а не по порядку ключей - после перестановки строк они
 * идут вразнобой.
 */
export function rowValues(
  fields: Readonly<Record<string, { readonly value?: unknown } | undefined>>,
  array: string,
  field: string,
): unknown[] {
  const pattern = new RegExp(`^${array}\\.(\\d+)\\.${field}$`);
  return Object.entries(fields)
    .map(([path, state]) => {
      const found = pattern.exec(path);
      return found ? { row: Number(found[1]), value: state?.value } : null;
    })
    .filter((entry): entry is { row: number; value: unknown } => entry !== null)
    .sort((a, b) => a.row - b.row)
    .map((entry) => entry.value);
}

/** Мелкий кадр для превью: в редакторе полный файл не нужен. */
function smallSrc(doc: MediaCard): string | null {
  return doc.sizes?.['thumbnail']?.url || doc.thumbnailURL || doc.url || null;
}

function byKey(docs: readonly MediaCard[]): Map<string, MediaCard> {
  return new Map(docs.map((doc) => [String(doc.id), doc]));
}

/**
 * Галерея в том виде, что выбран у блока.
 *
 * @remarks
 * Подряд кадры идут формой одиночного кадра сайта - 16:9 или 9:16; плиткой
 * и каруселью - формой самого снимка, по ней сайт и считает ряды.
 */
export function galleryPreview(
  keys: readonly string[],
  docs: LoadedCards,
  view: unknown,
): AttachmentPreview {
  const layout = pick(view, GALLERY_VIEWS, 'tiles');
  if (keys.length === 0) return { kind: 'empty', hint: 'Кадров пока нет', action: 'Выбрать кадры' };
  if (!docs) return LOADING;
  const found = byKey(docs);
  const frames = keys.flatMap((key): PreviewFrame[] => {
    const doc = found.get(key);
    const src = doc && smallSrc(doc);
    if (!doc || !src) return [];
    const aspect =
      layout === 'list'
        ? frameAspectOf(doc)
        : doc.width && doc.height
          ? { width: doc.width, height: doc.height }
          : undefined;
    return [{ id: key, src, aspect }];
  });
  return frames.length > 0 ? { kind: 'frames', layout, frames } : MISSING;
}

/**
 * Видео: кадр записи и её название.
 *
 * @remarks
 * Подпись, набранная в самом блоке, главнее названия записи - так же
 * решает сайт, пока устаревшее поле не очищено.
 */
export function recordingPreview(
  key: string | null,
  docs: LoadedCards,
  ownTitle: unknown,
  width: unknown,
): AttachmentPreview {
  if (!key) return { kind: 'empty', hint: 'Видео не выбрано', action: 'Выбрать видео' };
  if (!docs) return LOADING;
  const doc = byKey(docs).get(key);
  if (!doc) return MISSING;
  const title =
    (typeof ownTitle === 'string' && ownTitle.trim()) || doc.caption || doc.filename || '';
  return { kind: 'recording', poster: doc.thumbnailURL || null, title, wide: width === 'wide' };
}

/** Документы в выбранном виде: имя, вес, тип; своё название строки главнее имени. */
export function documentsPreview(
  keys: readonly (string | null)[],
  titles: readonly unknown[],
  docs: LoadedCards,
  layout: unknown,
): AttachmentPreview {
  if (!keys.some((key) => key !== null))
    return {
      kind: 'empty',
      hint: 'Документов пока нет',
      action: 'Выбрать документы',
    };
  if (!docs) return LOADING;
  const found = byKey(docs);
  const rows = keys.flatMap((key, row): PreviewDocument[] => {
    const doc = key ? found.get(key) : undefined;
    if (!key || !doc) return [];
    const own = titles[row];
    const name = (typeof own === 'string' && own.trim()) || doc.caption || doc.filename || key;
    return [
      {
        id: `${row}-${key}`,
        name,
        size: doc.filesize ? formatBytes(doc.filesize) : '',
        type: fileKindOf(doc.mimeType),
        thumb: doc.previewUrl || null,
      },
    ];
  });
  return rows.length > 0
    ? { kind: 'documents', layout: pick(layout, DOCUMENTS_LAYOUTS, 'cards'), rows }
    : MISSING;
}
