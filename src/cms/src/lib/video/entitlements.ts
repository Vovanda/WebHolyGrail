import type { AccessDecision, AccessPolicy, RequestedVideo, Viewer } from './access-policy';

/**
 * Политика доступа с правами на плейлисты.
 *
 * @remarks
 * Правило, доказанное в `spec/video/access-invariants.smt2`: открытый видео
 * смотрят все, даже находясь в платном плейлисте; закрытый открывается, если у
 * зрителя есть право хотя бы на один плейлист, куда этот видео входит.
 *
 * «Хотя бы один» — не поблажка, а естественное следствие: один и тот же видео
 * встречается в нескольких плейлистах, и получивший право на любой из них должен
 * его смотреть.
 */

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Плейлисты, где состоит видео и на которые у зрителя есть действующее право.
   * Пусто — прав нет.
   */
  entitledPlaylistsFor(
    videoId: string | number,
    viewerId: string | number,
    now: Date,
  ): Promise<ReadonlyArray<string | number>>;

  /**
   * Плейлисты, куда входит видео.
   *
   * @remarks
   * Нужны, чтобы сверить их с плейлистами из токена: право, выданное кодом,
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

      // Своё — без проверки прав: покупать доступ к собственному видео
      // не у кого. Роль администратора сюда не входит намеренно.
      if (viewer.ownsVideo) return { allowed: true };

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
