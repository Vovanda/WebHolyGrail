import type { PayloadRequest } from 'payload';

import { translitSlug } from './translit';

/**
 * Адрес канала для участника: транслит имени, а при пустом имени - часть почты
 * до собаки. Совпадения разводятся номером, потому что адрес уникален.
 */
export function channelFrom(name: unknown, email: unknown): string {
  const source = String(name ?? '').trim() || String(email ?? '').split('@')[0] || '';
  return translitSlug(source, 24) || 'user';
}

/**
 * Свободный адрес: к основе добавляется номер, пока имя занято.
 */
export async function freeChannel(
  req: Pick<PayloadRequest, 'payload'>,
  base: string,
): Promise<string> {
  let candidate = base;
  for (let n = 2; n < 100; n += 1) {
    const taken = await req.payload.count({
      collection: 'users',
      where: { channel: { equals: candidate } },
    });
    if (taken.totalDocs === 0) return candidate;
    candidate = `${base}-${n}`;
  }
  return candidate;
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
  member: string | number,
): Promise<string | null> {
  const person = (await req.payload.findByID({
    collection: 'users',
    id: member,
    depth: 0,
    overrideAccess: true,
  })) as { channel?: string | null; name?: string | null; email?: string | null } | null;

  if (!person) return null;
  if (person.channel) return person.channel;

  const address = await freeChannel(req, channelFrom(person.name, person.email));
  await req.payload.update({
    collection: 'users',
    id: member,
    data: { channel: address },
    overrideAccess: true,
  });
  return address;
}
