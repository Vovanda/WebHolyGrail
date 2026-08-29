import type { Payload } from 'payload';

import type { EntitlementSource } from './entitlements';

/**
 * Источник прав поверх Payload.
 *
 * @remarks
 * Право лежит на том, за что заплачено: на подборке или на самой записи. Вниз
 * оно распространяется при проверке, а не размножением записей, поэтому состав
 * подборки можно менять, ничего не догоняя.
 *
 * Права с истёкшим сроком отсекаются здесь же: подарок на неделю иначе работал бы
 * вечно.
 */
export function payloadEntitlements(payload: Payload): EntitlementSource {
  const alive = (expiresAt: string | null | undefined, now: Date): boolean =>
    !expiresAt || new Date(expiresAt).getTime() > now.getTime();

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

    async entitledToVideo(videoId, viewerId, now) {
      const grants = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { viewer: { equals: viewerId } },
            { 'resource.value': { equals: videoId } },
            { 'resource.relationTo': { equals: 'media' } },
          ],
        },
        depth: 0,
        limit: 10,
        overrideAccess: true,
      });

      return grants.docs.some((raw) =>
        alive((raw as { expiresAt?: string | null }).expiresAt, now),
      );
    },

    async entitledPlaylistsFor(videoId, viewerId, now) {
      const ids = await playlistsContaining(videoId);
      if (ids.length === 0) return [];

      // Перечисление равенств, а не «в списке»: у связи, умеющей два вида
      // объектов, второй превращается в негодный SQL и запрос падает.
      const grants = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { viewer: { equals: viewerId } },
            { 'resource.relationTo': { equals: 'playlists' } },
            { or: ids.map((id) => ({ 'resource.value': { equals: id } })) },
          ],
        },
        depth: 0,
        limit: 50,
        overrideAccess: true,
      });

      return grants.docs.flatMap((raw) => {
        const grant = raw as {
          resource?: { value?: string | number } | string | number;
          expiresAt?: string | null;
        };
        if (!alive(grant.expiresAt, now)) return [];
        const target =
          typeof grant.resource === 'object' && grant.resource !== null
            ? grant.resource.value
            : grant.resource;
        return target === undefined ? [] : [target];
      });
    },
  };
}
