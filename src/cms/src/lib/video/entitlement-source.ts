import type { Payload } from 'payload';

import type { EntitlementSource } from './entitlements';

/**
 * Источник прав поверх Payload.
 *
 * @remarks
 * Два запроса вместо одного: сначала наборы, где состоит ролик, потом права
 * зрителя ровно на них. Связь «ролик в наборе» лежит в массиве внутри набора,
 * и одним запросом от прав к ролику не пройти.
 *
 * Права с истёкшим сроком отсекаются здесь же: подарок на неделю иначе
 * работал бы вечно.
 */
export function payloadEntitlements(payload: Payload): EntitlementSource {
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

  return {
    playlistsContaining,

    async entitledPlaylistsFor(videoId, viewerId, now) {
      const ids = await playlistsContaining(videoId);
      if (ids.length === 0) return [];

      const grants = await payload.find({
        collection: 'entitlements',
        where: {
          and: [{ viewer: { equals: viewerId } }, { playlist: { in: ids.join(',') } }],
        },
        depth: 0,
        limit: 50,
        overrideAccess: true,
      });

      return grants.docs.flatMap((raw) => {
        const grant = raw as { playlist?: string | number; expiresAt?: string | null };
        if (grant.expiresAt && new Date(grant.expiresAt).getTime() <= now.getTime()) return [];
        return grant.playlist === undefined ? [] : [grant.playlist];
      });
    },
  };
}
