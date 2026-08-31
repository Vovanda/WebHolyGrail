import type { PayloadRequest } from 'payload';

import { translitSlug } from './slug';

/**
 * Адрес канала для участника: транслит имени, а при пустом имени - часть почты
 * до собаки. Совпадения разводятся номером, потому что адрес уникален.
 */
export function channelFrom(name: unknown, email: unknown): string {
  const источник = String(name ?? '').trim() || String(email ?? '').split('@')[0] || '';
  return translitSlug(источник, 24) || 'user';
}

/**
 * Свободный адрес: к основе добавляется номер, пока имя занято.
 */
export async function freeChannel(
  req: Pick<PayloadRequest, 'payload'>,
  основа: string,
): Promise<string> {
  let кандидат = основа;
  for (let n = 2; n < 100; n += 1) {
    const занято = await req.payload.count({
      collection: 'users',
      where: { channel: { equals: кандидат } },
    });
    if (занято.totalDocs === 0) return кандидат;
    кандидат = `${основа}-${n}`;
  }
  return кандидат;
}

/**
 * Заводит участнику адрес канала, если его ещё нет.
 *
 * @remarks
 * Адрес проставлялся только при заведении учётной записи, поэтому у тех, кто
 * заведён раньше самого поля, канала не было вовсе: страница отвечала «не
 * найдено», хотя запись лежала общедоступной. Эта же вещь зовётся при заливке
 * видео - канал появляется вместе с первой записью, без похода в настройки.
 *
 * Уже заданный адрес не трогается никогда: ссылки на канал разошлись.
 * Возвращает адрес - и заведённый, и тот, что был.
 */
export async function ensureChannel(
  req: Pick<PayloadRequest, 'payload'>,
  участник: string | number,
): Promise<string | null> {
  const человек = (await req.payload.findByID({
    collection: 'users',
    id: участник,
    depth: 0,
    overrideAccess: true,
  })) as { channel?: string | null; name?: string | null; email?: string | null } | null;

  if (!человек) return null;
  if (человек.channel) return человек.channel;

  const адрес = await freeChannel(req, channelFrom(человек.name, человек.email));
  await req.payload.update({
    collection: 'users',
    id: участник,
    data: { channel: адрес },
    overrideAccess: true,
  });
  return адрес;
}
