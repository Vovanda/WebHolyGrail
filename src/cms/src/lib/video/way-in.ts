import type { Payload, Where } from 'payload';

/**
 * Есть ли чем открыть закрытое: живой код на доступ, который покрывает запись.
 *
 * @remarks
 * Форма ввода кода имеет смысл, только если такой код существует. Иначе человеку
 * показывают поле, в которое нечего ввести.
 *
 * Живой код - тот, что сработает прямо сейчас: не отозван, срок не вышел, предел
 * срабатываний не исчерпан. Вид кода роли не играет: и диктуемый, и присылаемый
 * открывают одинаково.
 */

export interface WayInTarget {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

/** Срок в будущем либо не задан вовсе. */
const notExpired = (now: Date): Where => ({
  or: [{ expiresAt: { exists: false } }, { expiresAt: { greater_than: now.toISOString() } }],
});

/**
 * Доступы, покрывающие цель: напрямую либо через подборку, в которой она лежит.
 *
 * @remarks
 * Перечисление равенств, а не «в списке»: у связи это превращается в негодный SQL.
 */
async function coveringAccesses(
  payload: Payload,
  target: WayInTarget,
): Promise<ReadonlyArray<string | number>> {
  const ways: Where[] =
    target.kind === 'playlists'
      ? [{ playlists: { equals: target.id } }]
      : [{ videos: { equals: target.id } }];

  if (target.kind === 'media') {
    const holders = await payload.find({
      collection: 'playlists',
      where: { 'items.video': { equals: target.id } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    });
    for (const doc of holders.docs) ways.push({ playlists: { equals: doc.id } });
  }

  const found = await payload.find({
    collection: 'media-accesses',
    where: { or: ways },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });

  return found.docs.map((doc) => doc.id);
}

export async function hasWayIn(
  payload: Payload,
  target: WayInTarget,
  now: Date = new Date(),
): Promise<boolean> {
  const accessIds = await coveringAccesses(payload, target);
  if (accessIds.length === 0) return false;

  const codes = await payload.find({
    collection: 'media-access-codes',
    where: {
      and: [
        { or: accessIds.map((id) => ({ access: { equals: id } })) },
        { revoked: { not_equals: true } },
        notExpired(now),
      ],
    },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });

  // Предел срабатываний считаем здесь, а не запросом: сравнить два поля между
  // собой фильтром нельзя, а кодов на один доступ всегда единицы.
  return codes.docs.some((raw) => {
    const doc = raw as { maxUses?: number | null; usedCount?: number | null };
    return doc.maxUses == null || (doc.usedCount ?? 0) < doc.maxUses;
  });
}
