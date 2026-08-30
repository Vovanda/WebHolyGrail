import type { Payload, Where } from 'payload';

import type { EntitlementSource, ViewerIdentity } from './entitlements';

/**
 * Источник прав поверх Payload.
 *
 * @remarks
 * Право лежит на том, за что заплачено: на подборке или на самой записи. Вниз
 * оно распространяется при проверке, а не размножением записей, поэтому состав
 * подборки можно менять, ничего не догоняя.
 *
 * Найти его можно двумя путями - по учётной записи и по опознанию, - и оба
 * равноправны: у вошедшего право держит учётная запись, у остальных идентичность,
 * выданное сервером при первой встрече. Ищем по обоим сразу, потому что взятое
 * по коду до входа обязано продолжать работать после.
 *
 * Права с истёкшим сроком отсекаются здесь же: подарок на неделю иначе работал бы
 * вечно.
 */
export function payloadEntitlements(payload: Payload): EntitlementSource {
  const alive = (expiresAt: string | null | undefined, now: Date): boolean =>
    !expiresAt || new Date(expiresAt).getTime() > now.getTime();

  /**
   * Условия «право принадлежит этому зрителю».
   *
   * @remarks
   * Собирается по тому, что о зрителе известно, а не одним выражением с пустыми
   * значениями: `viewer равен null` нашёл бы все права, выданные не на учётную
   * запись, - то есть чужие анонимные разом.
   */
  const identityOf = (who: ViewerIdentity): Where[] => {
    const ways: Where[] = [];
    if (who.userId !== null && who.userId !== undefined) {
      ways.push({ viewer: { equals: who.userId } });
    }
    if (who.ref) ways.push({ ref: { equals: who.ref } });
    return ways;
  };

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
    async entitledToVideo(videoId, who, now) {
      const ways = identityOf(who);
      if (ways.length === 0) return false;

      const grants = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { or: ways },
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

    async entitledPlaylistsFor(videoId, who, now) {
      const ways = identityOf(who);
      if (ways.length === 0) return [];

      const ids = await playlistsContaining(videoId);
      if (ids.length === 0) return [];

      // Перечисление равенств, а не «в списке»: у связи, умеющей два вида
      // объектов, второй превращается в негодный SQL и запрос падает.
      const grants = await payload.find({
        collection: 'entitlements',
        where: {
          and: [
            { or: ways },
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
