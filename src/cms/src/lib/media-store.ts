import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

import { s3Storage } from './media/adapters';
import type { StoragePort } from './media/ports';
import { movePlan, type Move } from './media-move';
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
 * Копирование файла и всех его копий в другую папку хранилища.
 *
 * @remarks
 * Прежнее место не трогается: его убирает {@link dropLeftovers}, когда запись
 * с новыми адресами уже сохранена. Сохранение может не пройти - проверка полей
 * идёт после хуков коллекции, - и тогда запись остаётся на старом месте вместе
 * с файлами, а лишними оказываются только новые копии.
 *
 * Копия, которой нет на старом месте, но есть на новом, считается уже
 * перенесённой: так повторяется перенос, оборванный между копированием
 * и удалением.
 *
 * Перенос имеет смысл только в бакете: без него хранилищем служит сама CMS,
 * адрес у файла плоский, и папка в него не входит. Поэтому без бакета
 * возвращается пустой перенос - менять нечего.
 */
export async function copyToFolder(
  doc: MediaRecord,
  to: string,
): Promise<{ patch: Record<string, unknown>; leftovers: string[] }> {
  if (!process.env['S3_BUCKET']) return { patch: {}, leftovers: [] };

  const store = s3Storage();
  const { moves, patch } = movePlan({ doc, to, urlForKey: (key) => store.urlForKey(key) });
  await copyFiles(store, moves);
  return { patch, leftovers: moves.map((move) => move.from) };
}

/** Копирует каждый файл на новое место; уже перенесённый пропускает. */
export async function copyFiles(
  store: Pick<StoragePort, 'readSource' | 'put' | 'urlForKey'>,
  moves: readonly Move[],
): Promise<void> {
  for (const move of moves) {
    const body = await store.readSource(store.urlForKey(move.from)).catch(async (error) => {
      const moved = await store.readSource(store.urlForKey(move.to)).then(
        () => true,
        () => false,
      );
      if (moved) return null;
      throw error;
    });
    if (!body) continue;
    await store.put(move.to, {
      // Путь у файла раздачи служит именем внутри неё; здесь ключ задан целиком.
      path: move.to,
      body,
      contentType: move.contentType,
    });
  }
}

/** Убирает файлы с прежнего места после того, как запись переехала. */
export async function dropLeftovers(keys: readonly string[]): Promise<void> {
  if (!process.env['S3_BUCKET'] || keys.length === 0) return;
  const store = s3Storage();
  for (const key of keys) await store.remove(key);
}
