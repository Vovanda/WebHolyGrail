/**
 * Перенос файла в другую папку хранилища: что куда переезжает.
 *
 * @remarks
 * Здесь только разбор записи и счёт ключей - ни сети, ни хранилища, поэтому
 * всё проверяется без запуска CMS. Копирует и удаляет тот, кто вызвал.
 *
 * Папка живёт в ключе объекта, а не в записи: пока файл не переехал, смена
 * поля даёт адрес, по которому ничего нет. Поэтому перенос и поле меняются
 * вместе, одной операцией.
 */

import { copiesOf, type Copy, type MediaRecord } from './media-copies';

/** Один переезд: откуда и куда. */
export interface Move {
  readonly from: string;
  readonly to: string;
  readonly filename: string;
}

/** Ключ объекта в хранилище: папка и имя файла. */
export function storageKey(prefix: string | null | undefined, filename: string): string {
  const folder = (prefix ?? '').replace(/^\/+|\/+$/g, '');
  return folder ? `${folder}/${filename}` : filename;
}

/**
 * Что переедет при смене папки и какими станут адреса.
 *
 * @remarks
 * Переезжают все копии разом: оставить ступени в прежней папке значит получить
 * запись, половина которой ведёт в одно место, половина в другое.
 *
 * Пустая папка - это корень хранилища, и переезд в неё такой же обычный, как
 * и из неё. Совпадение старой и новой папки переездом не считается: делать
 * нечего, и лишняя работа с хранилищем тут опаснее бездействия.
 */
export function movePlan({
  doc,
  to,
  urlForKey,
}: {
  readonly doc: MediaRecord;
  readonly to: string;
  /** Как хранилище строит адрес по ключу. */
  readonly urlForKey: (key: string) => string;
}): { moves: Move[]; patch: Record<string, unknown> } {
  const from = doc.prefix ?? '';
  const same = storageKey(from, 'x') === storageKey(to, 'x');
  if (same) return { moves: [], patch: {} };

  const copies = copiesOf(doc);
  const moves = copies.map((copy) => ({
    filename: copy.filename,
    from: storageKey(from, copy.filename),
    to: storageKey(to, copy.filename),
  }));

  const sizes: Record<string, { url: string }> = {};
  for (const copy of copies) {
    if (copy.original) continue;
    sizes[copy.step] = { url: urlForKey(storageKey(to, copy.filename)) };
  }

  const original = copies.find((copy: Copy) => copy.original);

  return {
    moves,
    patch: {
      prefix: to,
      ...(original ? { url: urlForKey(storageKey(to, original.filename)) } : {}),
      ...(Object.keys(sizes).length > 0 ? { sizes } : {}),
    },
  };
}
