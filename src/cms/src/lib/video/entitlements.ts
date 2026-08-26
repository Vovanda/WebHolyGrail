import type { AccessDecision, AccessPolicy, RequestedVideo, Viewer } from './access-policy';

/**
 * Политика доступа с правами на наборы.
 *
 * @remarks
 * Правило, доказанное в `spec/video/access-invariants.smt2`: открытый ролик
 * смотрят все, даже находясь в платном наборе; закрытый открывается, если у
 * зрителя есть право хотя бы на один набор, куда этот ролик входит.
 *
 * «Хотя бы один» — не поблажка, а естественное следствие: один и тот же ролик
 * встречается в нескольких наборах, и получивший право на любой из них должен
 * его смотреть.
 */

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Наборы, где состоит ролик и на которые у зрителя есть действующее право.
   * Пусто — прав нет.
   */
  entitledPlaylistsFor(
    videoId: string | number,
    viewerId: string | number,
    now: Date,
  ): Promise<ReadonlyArray<string | number>>;

  /**
   * Наборы, куда входит ролик.
   *
   * @remarks
   * Нужны, чтобы сверить их с наборами из токена: право, выданное кодом,
   * записи в базе не имеет, и спросить о нём базу нельзя.
   */
  playlistsContaining(videoId: string | number): Promise<ReadonlyArray<string | number>>;
}

export function entitlementPolicy(
  source: EntitlementSource,
  now: () => Date = () => new Date(),
): AccessPolicy {
  return {
    async decide(video: RequestedVideo, viewer: Viewer): Promise<AccessDecision> {
      if (video.access === 'public') return { allowed: true };

      // Своё и администраторское — без проверки прав: покупать доступ
      // к собственному ролику не у кого.
      if (viewer.ownsVideo || viewer.isAdmin) return { allowed: true };

      // Погашенный код проверяется первым и работает без входа: он и нужен
      // тем, у кого учётной записи нет.
      const granted = viewer.grantedPlaylists ?? [];
      if (granted.length > 0) {
        const containing = await source.playlistsContaining(video.id);
        // Идентификаторы приходят из токена строкой, из базы — числом.
        const asText = new Set(containing.map(String));
        if (granted.some((id) => asText.has(String(id)))) return { allowed: true };
      }

      // Купленное право закреплено за учётной записью: анониму его не за кем
      // удержать.
      if (viewer.userId === null) return { allowed: false, reason: 'sign-in-required' };

      const entitled = await source.entitledPlaylistsFor(video.id, viewer.userId, now());
      if (entitled.length > 0) return { allowed: true };

      // Вошёл, но права нет — это уже не «войди», а «нужен доступ»: тексты
      // и кнопки у этих случаев разные.
      return { allowed: false, reason: 'not-entitled' };
    },
  };
}
