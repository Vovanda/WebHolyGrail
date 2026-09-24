import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { s3Storage } from './media/adapters';
import { movePlan } from './media-move';
import type { MediaRecord } from './media-copies';

/** Папка, в которой CMS держит файлы, когда бакета нет. */
const LOCAL_DIR = 'media';

/**
 * Удаление одной копии файла из хранилища.
 *
 * @remarks
 * Хранилищ у шаблона два, и выбираются они тем же признаком, что и во всём
 * остальном: задан бакет - файлы лежат в нём, не задан - их держит сама CMS
 * рядом с собой. Знание об этой развилке собрано здесь, чтобы вызывающему
 * было всё равно, куда именно положен файл.
 *
 * Отсутствующий файл не считается бедой: запись могла разойтись с хранилищем
 * раньше - при ручной уборке или переносе, - и уборка остатков как раз то,
 * ради чего сюда пришли.
 */
export async function dropStoredFile(filename: string, url: string): Promise<void> {
  if (process.env['S3_BUCKET']) {
    const store = s3Storage();
    const key = store.keyFromUrl(url) || filename;
    await store.remove(key);
    return;
  }

  try {
    await unlink(join(process.cwd(), LOCAL_DIR, filename));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') throw error;
  }
}

/**
 * Перенос файла и всех его копий в другую папку хранилища.
 *
 * @remarks
 * Копирование идёт до удаления: пока новое не встало, старое остаётся на месте,
 * и оборванный перенос теряет место в хранилище, но не сам файл. Обратный
 * порядок стоил бы кадра при первой же сетевой заминке.
 *
 * Перенос имеет смысл только в бакете: без него хранилищем служит сама CMS,
 * адрес у файла плоский, и папка в него не входит. Поэтому без бакета
 * возвращается пустой перенос - менять нечего.
 */
export async function moveToFolder(doc: MediaRecord, to: string): Promise<Record<string, unknown>> {
  if (!process.env['S3_BUCKET']) return {};

  const store = s3Storage();
  const { moves, patch } = movePlan({ doc, to, urlForKey: (key) => store.urlForKey(key) });
  if (moves.length === 0) return {};

  for (const move of moves) {
    const body = await store.readSource(store.urlForKey(move.from));
    await store.put(move.to, {
      // Путь у файла раздачи служит именем внутри неё; здесь ключ задан целиком.
      path: move.to,
      body,
      contentType: doc.mimeType ?? 'application/octet-stream',
    });
  }
  for (const move of moves) {
    await store.remove(move.from);
  }

  return patch;
}
