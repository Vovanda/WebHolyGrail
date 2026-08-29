import type { AccessDecision, AccessPolicy, RequestedVideo, Viewer } from './access-policy';

/**
 * Политика доступа: ключ выдаётся на закрытое и открывает всё, что внутри.
 *
 * @remarks
 * Правило одно, и из него выводятся все случаи. Открытая запись смотрится всеми,
 * даже лёжа в платной подборке, - это бесплатный вводный урок. Закрытая
 * открывается правом на неё саму либо правом на любую подборку, куда она входит.
 *
 * Право на подборку перекрывает поштучный замок записи намеренно: серии продаются
 * и по одной, и оптом, и купивший оптом не должен упираться в те, что кто-то
 * когда-то продал отдельно.
 *
 * Обратное неверно: право на запись подборку не открывает. Купил девятую серию -
 * купил девятую серию.
 *
 * Модель целиком - `docs/whg/41-access.md`.
 */

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Есть ли у зрителя действующее право на саму эту запись.
   *
   * @remarks
   * Право поштучное: им открывается одна запись и ничего больше. Нужно там, где
   * запись продаётся отдельно или не лежит ни в одной подборке - иначе такую
   * не открыть ничем.
   */
  entitledToVideo(videoId: string | number, viewerId: string | number, now: Date): Promise<boolean>;

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

      // Право на саму запись - раньше, чем на подборки: оно дешевле в проверке
      // и покрывает записи, не лежащие ни в одной.
      if (await source.entitledToVideo(video.id, viewer.userId, now())) return { allowed: true };

      const entitled = await source.entitledPlaylistsFor(video.id, viewer.userId, now());
      if (entitled.length > 0) return { allowed: true };

      // Вошёл, но права нет — это уже не «войди», а «нужен доступ»: тексты
      // и кнопки у этих случаев разные.
      return { allowed: false, reason: 'not-entitled' };
    },
  };
}
