import type { Payload } from 'payload';

import { generateAccessCode } from '../../video/access-code';

/**
 * Выдача демонстрационного кода на подборку.
 *
 * @remarks
 * Вещь витрины, а не движка: у сайтов на шаблоне такой ручки нет, и синк эту
 * папку не трогает. Код одноразовый и живёт минуты - он нужен на один показ.
 */

export interface DemoCodeArgs {
  readonly payload: Payload;
  /** Подборка, которую открывает витрина. */
  readonly playlistId: number;
  /** Длина значения: берётся из настроек сайта. */
  readonly length: number;
  /** До какой даты живёт сам код. */
  readonly expiresAt: string;
  /** На сколько минут открывает выданное право. */
  readonly grantMinutes: number;
}

export interface DemoCodeResult {
  readonly code: string;
  readonly expiresAt: string;
}

/**
 * Доступ, покрывающий подборку витрины.
 *
 * @remarks
 * Заводится один раз: код печатается от доступа, а плодить по доступу на каждое
 * нажатие кнопки незачем.
 */
async function accessForPlaylist(payload: Payload, playlistId: number): Promise<number> {
  const covering = await payload.find({
    collection: 'media-accesses',
    where: { playlists: { equals: playlistId } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });

  const found = covering.docs[0] as { id: number } | undefined;
  if (found) return found.id;

  const created = (await payload.create({
    collection: 'media-accesses',
    data: { title: 'Демонстрационный доступ', playlists: [playlistId] },
    overrideAccess: true,
  })) as { id: number };

  return created.id;
}

export async function issueDemoCode({
  payload,
  playlistId,
  length,
  expiresAt,
  grantMinutes,
}: DemoCodeArgs): Promise<DemoCodeResult> {
  const access = await accessForPlaylist(payload, playlistId);
  const code = generateAccessCode(length);

  /*
    Выданный код всегда начинает с чистого листа. Символов немного, и рано или
    поздно то же значение выпадет снова; сохранись при этом прежняя история
    срабатываний, человек получил бы рабочий на вид код и отказ «уже использован».
  */
  const clash = await payload.find({
    collection: 'media-access-codes',
    where: { code: { equals: code } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });

  const previous = clash.docs[0] as { id: string | number } | undefined;

  if (previous) {
    await payload.update({
      collection: 'media-access-codes',
      id: previous.id,
      data: { code, access, maxUses: 1, usedCount: 0, expiresAt, grantMinutes, grantDays: null },
      overrideAccess: true,
    });
  } else {
    await payload.create({
      collection: 'media-access-codes',
      data: { code, access, maxUses: 1, usedCount: 0, expiresAt, grantMinutes, grantDays: null },
      overrideAccess: true,
    });
  }

  return { code, expiresAt };
}
