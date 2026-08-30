import type { Payload, Where } from 'payload';

import type { EntitlementSource, ViewerIdentity } from './entitlements';

/**
 * Источник прав поверх Payload.
 *
 * @remarks
 * Право лежит на доступе, а не на каждом материале внутри, и вниз
 * распространяется при проверке: доступ, в который входит подборка, открывает
 * всё, что в ней лежит сейчас. Поэтому состав подборки меняется без единой
 * догоняющей правки.
 *
 * Живость считается, а не хранится флагом: истёкшее иначе ждало бы, пока его
 * кто-нибудь погасит, и до тех пор пускало бы. Срок берётся по более раннему
 * из двух - отсечки доступа и своего срока права.
 *
 * Ищем по учётной записи и по маркеру посетителя сразу: право, взятое по коду
 * до входа, обязано продолжать работать после.
 */
/** Один открытый предмет: подборка целиком или отдельная запись. */
export interface GrantedItem {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

/** С глубиной ноль в связи лежит номер, с большей — сам документ. */
const idOf = (value: unknown): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'number' || typeof id === 'string') return id;
  }
  return null;
};

const listOf = (raw: unknown): ReadonlyArray<string | number> =>
  Array.isArray(raw) ? raw.map(idOf).filter((id): id is string | number => id !== null) : [];

/**
 * Что открывает доступ: его подборки и его отдельные записи.
 *
 * @remarks
 * Активация знает про право и не знает, что именно от него открылось: состав
 * держит сам доступ. Страница же снимает замки поимённо, поэтому состав
 * читается отдельным вопросом.
 */
export async function accessContents(
  payload: Payload,
  accessId: string | number,
): Promise<ReadonlyArray<GrantedItem>> {
  const doc = (await payload
    .findByID({ collection: 'media-accesses', id: accessId, depth: 0, overrideAccess: true })
    .catch(() => null)) as { playlists?: unknown; videos?: unknown } | null;

  if (!doc) return [];

  return [
    ...listOf(doc.playlists).map((id) => ({ kind: 'playlists' as const, id })),
    ...listOf(doc.videos).map((id) => ({ kind: 'media' as const, id })),
  ];
}

export function payloadEntitlements(payload: Payload): EntitlementSource {
  const deadlineAlive = (deadline: string | null | undefined, now: Date): boolean =>
    !deadline || new Date(deadline).getTime() > now.getTime();

  /**
   * Условия «право принадлежит этому зрителю».
   *
   * @remarks
   * Собирается по тому, что о зрителе известно, а не одним выражением с пустыми
   * значениями: `viewer равен null` нашёл бы все права, выданные не на учётную
   * запись, - то есть чужие разом.
   */
  const identityOf = (who: ViewerIdentity): Where[] => {
    const ways: Where[] = [];
    if (who.userId !== null && who.userId !== undefined) {
      ways.push({ viewer: { equals: who.userId } });
    }
    if (who.visitorMarker) ways.push({ visitorMarker: { equals: who.visitorMarker } });
    return ways;
  };

  /** Подборки, в которых лежит эта запись: через них доступ покрывает её тоже. */
  const playlistsContaining = async (videoId: string | number) => {
    const found = await payload.find({
      collection: 'playlists',
      where: { 'items.video': { equals: videoId } },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    });
    return found.docs.map((doc) => doc.id);
  };

  /**
   * Доступы, покрывающие запись: напрямую или через подборку.
   *
   * @remarks
   * Отсечка отсеивается здесь же - закрытый доступ не открывает ничего, сколько
   * бы прав под ним ни выдали.
   */
  const coveringAccesses = async (videoId: string | number, now: Date) => {
    const playlistIds = await playlistsContaining(videoId);
    const ways: Where[] = [{ videos: { equals: videoId } }];
    for (const id of playlistIds) ways.push({ playlists: { equals: id } });

    const found = await payload.find({
      collection: 'media-accesses',
      where: { or: ways },
      depth: 0,
      limit: 50,
      overrideAccess: true,
    });

    return found.docs
      .filter((doc) => deadlineAlive((doc as { cutoff?: string | null }).cutoff, now))
      .map((doc) => doc.id);
  };

  return {
    async covered(videoId, who, now) {
      const ways = identityOf(who);
      if (ways.length === 0) return false;

      const accessIds = await coveringAccesses(videoId, now);
      if (accessIds.length === 0) return false;

      // Перечисление равенств, а не «в списке»: у связи это превращается
      // в негодный SQL и запрос падает.
      const rights = await payload.find({
        collection: 'media-access-rights',
        where: {
          and: [{ or: ways }, { or: accessIds.map((id) => ({ access: { equals: id } })) }],
        },
        depth: 0,
        limit: 50,
        overrideAccess: true,
      });

      return rights.docs.some((raw) => {
        const right = raw as {
          expiresAt?: string | null;
          views?: number | null;
          maxViews?: number | null;
        };
        if (!deadlineAlive(right.expiresAt, now)) return false;
        // Ноль и пусто в пределе значат «без ограничения»: это отсутствие
        // условия, а не условие «ноль».
        const limit = right.maxViews ?? 0;
        return limit <= 0 || (right.views ?? 0) < limit;
      });
    },
  };
}
