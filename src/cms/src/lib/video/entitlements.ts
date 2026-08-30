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

/**
 * Кто смотрит, в том виде, в каком по нему находятся права.
 *
 * @remarks
 * Учётная запись и идентичность держат право одинаково: первая - у вошедшего,
 * второе - у того, кто её не заводил. Поэтому они передаются вместе, а не
 * по отдельности: разделив их, пришлось бы звать источник дважды и сливать
 * ответы на месте вызова - в каждом из четырёх мест по-своему.
 *
 * У вошедшего идентичность тоже есть: право, взятое по коду до входа, записано
 * на него и обязано продолжать работать после.
 */
export interface ViewerIdentity {
  /** `null` — учётной записи нет. */
  readonly userId: string | number | null;
  /** Идентичность из токена; пусто — токена не было. */
  readonly ref?: string | undefined;
}

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Есть ли действующее право на саму эту запись.
   *
   * @remarks
   * Право поштучное: им открывается одна запись и ничего больше. Нужно там, где
   * запись продаётся отдельно или не лежит ни в одной подборке - иначе такую
   * не открыть ничем.
   */
  entitledToVideo(videoId: string | number, who: ViewerIdentity, now: Date): Promise<boolean>;

  /**
   * Плейлисты, где состоит видео и на которые есть действующее право.
   * Пусто — прав нет.
   */
  entitledPlaylistsFor(
    videoId: string | number,
    who: ViewerIdentity,
    now: Date,
  ): Promise<ReadonlyArray<string | number>>;
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

      const who: ViewerIdentity = { userId: viewer.userId, ref: viewer.ref };

      // Ни учётной записи, ни маркера: искать право не по чему. Так бывает
      // у запроса без токена - страницу открыли раньше, чем выдался токен.
      if (who.userId === null && !who.ref) return { allowed: false, reason: 'not-entitled' };

      // Право на саму запись - раньше, чем на подборки: оно дешевле в проверке
      // и покрывает записи, не лежащие ни в одной.
      if (await source.entitledToVideo(video.id, who, now())) return { allowed: true };

      const entitled = await source.entitledPlaylistsFor(video.id, who, now());
      if (entitled.length > 0) return { allowed: true };

      // Права нет - значит нужен доступ, и учётная запись тут ни при чём:
      // код открывает запись предъявителю, а право ложится на его маркер.
      return { allowed: false, reason: 'not-entitled' };
    },
  };
}
