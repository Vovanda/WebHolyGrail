import type { Payload, Where } from 'payload';

/**
 * Есть ли чем открыть закрытое: живой код или ссылка-приглашение.
 *
 * @remarks
 * Форма ввода кода на странице закрытой записи имеет смысл, только если такой
 * код существует. Иначе человеку показывают поле, в которое нечего ввести,
 * и он уходит с ощущением, что сайт сломан.
 *
 * Живым считается способ, который сработает прямо сейчас: срок не вышел, предел
 * срабатываний не исчерпан, ссылка не отозвана. Просроченный код лежит в базе
 * годами и о применимости формы ничего не говорит.
 *
 * Открыть запись может и код на подборку, в которой она лежит, поэтому ищем
 * по обоим адресам сразу.
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
 * Куда смотреть: на саму запись и на подборки, в которых она лежит.
 *
 * @remarks
 * Связь, умеющая два вида объектов, сверяется перечислением равенств: оператор
 * «в списке» превращается для неё в негодный SQL.
 */
async function addressesOf(payload: Payload, target: WayInTarget): Promise<ReadonlyArray<Where>> {
  const own: Where = {
    and: [
      { 'resource.relationTo': { equals: target.kind } },
      { 'resource.value': { equals: target.id } },
    ],
  };
  if (target.kind === 'playlists') return [own];

  const holders = await payload.find({
    collection: 'playlists',
    where: { 'items.video': { equals: target.id } },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });

  return [
    own,
    ...holders.docs.map((doc) => ({
      and: [
        { 'resource.relationTo': { equals: 'playlists' } },
        { 'resource.value': { equals: doc.id } },
      ],
    })),
  ];
}

export async function hasWayIn(
  payload: Payload,
  target: WayInTarget,
  now: Date = new Date(),
): Promise<boolean> {
  const addresses = await addressesOf(payload, target);

  const codes = await payload.find({
    collection: 'access-codes',
    where: { and: [{ or: [...addresses] }, notExpired(now)] },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });

  // Предел срабатываний считаем здесь, а не запросом: сравнить два поля между
  // собой фильтром нельзя, а кодов на один адрес всегда единицы.
  const liveCode = codes.docs.some((raw) => {
    const doc = raw as { maxUses?: number | null; usedCount?: number | null };
    return doc.maxUses == null || (doc.usedCount ?? 0) < doc.maxUses;
  });
  if (liveCode) return true;

  const links = await payload.find({
    collection: 'access-links',
    where: { and: [{ or: [...addresses] }, { revoked: { not_equals: true } }, notExpired(now)] },
    depth: 0,
    limit: 50,
    overrideAccess: true,
  });

  return links.docs.some((raw) => {
    const doc = raw as { maxUses?: number | null; usedCount?: number | null };
    return doc.maxUses == null || (doc.usedCount ?? 0) < doc.maxUses;
  });
}
