import {
  APIError,
  type CollectionAfterChangeHook,
  type CollectionAfterReadHook,
  type CollectionBeforeChangeHook,
  type CollectionBeforeDeleteHook,
  type CollectionBeforeOperationHook,
} from 'payload';

import { ensureChannel } from './channel';
import { makeBlurData } from './image-blur';
import { isDarkImage } from './image-luma';
import type { MediaRecord } from './media-copies';
import { POSTER_PREFIX } from './media-folders';
import { withCacheBust, withManifestRoute, withStreamAddress } from './media-read';
import { moveToFolder } from './media-store';
import { renderPdfPreview } from './pdf-preview';
import { latinFilename } from './translit';
import { generateShortCode } from './video/short-code';

/**
 * Хуки коллекции медиатеки, по одному делу на хук.
 *
 * @remarks
 * Порядок в конфиге коллекции значим: автор ставится раньше, чем по нему
 * заводится канал. Чистые правила выдачи лежат в `media-read.ts`.
 */

const isVideo = (mime: unknown): boolean => String(mime ?? '').startsWith('video/');

/** Номер связи: она приходит то номером, то развёрнутым документом. */
const relationId = (value: unknown): unknown =>
  typeof value === 'object' && value !== null ? (value as { id?: unknown }).id : value;

/**
 * Имя залитого файла приводится к латинице.
 *
 * @remarks
 * Стоит до начала работы с файлом, а не перед сохранением записи: к тому
 * времени имя уже разошлось по ступеням, и переименование исходника оставило
 * бы копии с прежним.
 */
export const normalizeUploadName: CollectionBeforeOperationHook = ({ req, operation }) => {
  if (operation !== 'create' && operation !== 'update') return;
  const upload = req.file;
  if (upload?.name) upload.name = latinFilename(upload.name);
};

/**
 * Смена папки двигает сам файл, а не только запись.
 *
 * @remarks
 * Идёт до сохранения: пока новые адреса не записаны, оборванный перенос
 * оставляет запись целой и указывающей на прежнее место. Заливка нового файла
 * кладёт его сразу в нужную папку - двигать нечего.
 */
export const moveOnPrefixChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation !== 'update' || !originalDoc || req.file) return data;
  const to = typeof data?.['prefix'] === 'string' ? data['prefix'] : null;
  if (to === null || to === originalDoc.prefix) return data;

  const patch = await moveToFolder(originalDoc as MediaRecord, to);
  return { ...data, ...patch };
};

/**
 * Яркость и размытая заготовка картинки.
 *
 * @remarks
 * Считаются по загруженному файлу, пока он в руках: после сохранения он уходит
 * в хранилище, и достать его обратно можно только запросом по сети.
 */
export const measureImage: CollectionBeforeChangeHook = async ({ data, req }) => {
  const upload = req.file;
  if (upload?.data && String(upload.mimetype ?? '').startsWith('image/')) {
    data['isDark'] = await isDarkImage(upload.data);
    data['blurData'] = await makeBlurData(upload.data);
  }
  return data;
};

/**
 * Автор файла - тот, кто его залил.
 *
 * @remarks
 * Только при создании: правка чужой подписи не переписывает историю загрузок.
 */
export const stampUploader: CollectionBeforeChangeHook = ({ data, req, operation }) => {
  if (operation === 'create' && req.user && !data['uploadedBy']) {
    data['uploadedBy'] = req.user.id;
  }
  return data;
};

/**
 * У автора видео есть канал.
 *
 * @remarks
 * Адрес берётся у автора записи, а не у того, кто нажал «сохранить»: запись
 * могли залить за него или переложить на другого. Сбой не мешает сохранению -
 * канал заведётся при следующей правке.
 */
export const ensureAuthorChannel: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (!isVideo(data['mimeType'])) return data;
  const id = relationId(data['uploadedBy']);
  if (id !== undefined && id !== null && id !== '') {
    await ensureChannel(req, id as string | number).catch(() => undefined);
  }
  return data;
};

/**
 * Короткий код адреса - только видео и только один раз.
 *
 * @remarks
 * У остальных файлов своей страницы нет, а у существующего видео адрес уже
 * разошёлся по ссылкам.
 */
export const issueShortCode: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation === 'create' && !data['shortCode'] && isVideo(data['mimeType'])) {
    data['shortCode'] = generateShortCode();
  }
  return data;
};

/**
 * Адрес кадра рядом с записью следует за самим кадром.
 *
 * @remarks
 * Список получает связь номером, и адрес ему нужен рядом. Кадр могли
 * переснять - тогда у него новый адрес, и поле не должно отставать.
 */
export const syncPreviewUrl: CollectionBeforeChangeHook = ({ data }) => {
  const frame = data['preview'] as { url?: unknown } | number | string | null | undefined;
  if (typeof frame === 'object' && frame !== null && typeof frame.url === 'string') {
    data['previewUrl'] = frame.url;
  }
  return data;
};

/** Имя документа в интерфейсе: название, а без него имя файла. */
export const syncTitle: CollectionBeforeChangeHook = ({ data }) => {
  const caption = String(data['caption'] ?? '').trim();
  const filename = String(data['filename'] ?? '').trim();
  if (caption || filename) data['title'] = caption || filename;
  return data;
};

/**
 * Удаление видео - пометка, а не стирание.
 *
 * @remarks
 * Исходник стёрт после нарезки, восстановить запись неоткуда. Поэтому видео
 * пропадает с сайта сразу, а файлы стирает уборка по сроку из настроек. Ей
 * самой перехват не нужен: она ставит `skipDeleteGuard`, а уже помеченное
 * видео пропускается.
 *
 * Ответ - `APIError`: на обычную ошибку Payload отвечает «Something went
 * wrong», и человек не понимает, удалилось видео или нет.
 */
export const softDeleteVideo: CollectionBeforeDeleteHook = async ({ id, req, context }) => {
  if (context?.['skipDeleteGuard']) return;
  const doc = (await req.payload.findByID({
    collection: 'media',
    id,
    depth: 0,
    overrideAccess: true,
  })) as { mimeType?: string; hls?: { deletedAt?: string | null } };

  if (!isVideo(doc?.mimeType) || doc?.hls?.deletedAt) return;

  await req.payload.update({
    collection: 'media',
    id,
    data: { hls: { deletedAt: new Date().toISOString() } },
    context: { skipHlsQueue: true },
  });

  throw new APIError(
    'Видео скрыто с сайта. Файлы будут стёрты автоматически по истечении срока из настроек - до тех пор его можно вернуть.',
    400,
  );
};

/**
 * Нарезка загруженного видео ставится в очередь сама.
 *
 * @remarks
 * Только на загрузку файла: правка подписи или доступа перенарезки не требует.
 * Служебные обновления самой нарезки помечены `skipHlsQueue`, иначе каждое
 * запускало бы новый круг. Сбой очереди не роняет загрузку - файл уже
 * сохранён, а нарезку можно запустить из списка задач.
 */
export const queueVideoCut: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  if (context?.['skipHlsQueue'] || !req.file || !isVideo(doc?.mimeType)) return doc;

  try {
    await req.payload.jobs.queue({ task: 'build-hls', input: { mediaId: String(doc.id) } });
    await req.payload.update({
      collection: 'media',
      id: doc.id as string | number,
      data: { hls: { status: 'pending', error: null } },
      context: { skipHlsQueue: true },
    });
  } catch (error) {
    req.payload.logger.error(
      `[media] не удалось поставить нарезку для ${doc.id}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return doc;
};

/**
 * Кадр первой страницы у загруженного PDF.
 *
 * @remarks
 * Работает после создания: документ уже сохранён, и сбой рендера не мешает его
 * загрузить. Кадр ложится отдельным служебным файлом в то же хранилище и
 * получает тот же адрес раздачи, что и всё остальное.
 */
export const makePdfPreview: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc;
  if (doc?.mimeType !== 'application/pdf' || doc?.preview) return doc;

  const data = req.file?.data;
  if (!data) return doc;

  const preview = await renderPdfPreview(data as Buffer);
  if (!preview) return doc;

  try {
    const base = String(doc.filename ?? 'document').replace(/\.pdf$/i, '');
    const created = await req.payload.create({
      collection: 'media',
      data: {
        alt: `Первая страница документа «${base}»`,
        prefix: POSTER_PREFIX,
        derived: true,
      },
      file: {
        data: preview,
        name: `${base}-preview.webp`,
        mimetype: 'image/webp',
        size: preview.length,
      },
    });
    await req.payload.update({
      collection: 'media',
      id: doc.id as string | number,
      data: { preview: created.id, previewUrl: created.url ?? null },
    });
    return { ...doc, preview: created.id, previewUrl: created.url ?? null };
  } catch {
    return doc;
  }
};

export const exposeManifestRoute: CollectionAfterReadHook = ({ doc }) => withManifestRoute(doc);

export const exposeStreamPack: CollectionAfterReadHook = ({ doc }) => withStreamAddress(doc);

export const bustCdnCache: CollectionAfterReadHook = ({ doc }) => withCacheBust(doc);
