import type { AccessDecision, AccessPolicy, RequestedVideo, Viewer } from './access-policy';

/**
 * Политика доступа: закрытое открывает живое право на доступ, который его
 * покрывает.
 *
 * @remarks
 * Проверка двухступенчатая и в этом порядке: жив ли сам доступ, и только потом
 * смотрим право. Отсюда следует счёт срока по более раннему из двух - личная
 * бессрочность не переживает отсечку доступа.
 *
 * Открытая запись смотрится всеми, даже лёжа внутри платного доступа: это
 * бесплатный вводный урок, которым курс продают. Своё автор смотрит всегда -
 * иначе он публикует вслепую.
 *
 * Модель целиком - `docs/whg/41-access.md`.
 */

/**
 * Кто смотрит, в том виде, в каком по нему находятся права.
 *
 * @remarks
 * Учётная запись и маркер посетителя держат право одинаково, поэтому передаются
 * вместе, а не по отдельности: разделив их, пришлось бы звать источник дважды
 * и сливать ответы на месте вызова.
 *
 * Маркер есть всегда: сервер выдаёт его браузеру при первой встрече. Учётной
 * записи в шаблоне нет вовсе, и право по коду записывается на маркер - код
 * открывает запись предъявителю.
 */
export interface ViewerIdentity {
  /** `null` — учётной записи нет. */
  readonly userId: string | number | null;
  /** Маркер посетителя из токена; пусто — токена не было. */
  readonly visitorMarker?: string | undefined;
}

/** Откуда берутся права. Отделено, чтобы политику можно было проверить без базы. */
export interface EntitlementSource {
  /**
   * Есть ли у зрителя живое право на доступ, покрывающий эту запись.
   *
   * @remarks
   * Один вопрос вместо двух: покрытие считается внутри - доступ знает и свои
   * записи, и свои подборки, а состав подборки меняется без догоняющих правок.
   * Живость проверяется на обоих уровнях сразу, потому что раздельно её
   * пришлось бы сводить на месте вызова.
   */
  covered(videoId: string | number, who: ViewerIdentity, now: Date): Promise<boolean>;
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

      const who: ViewerIdentity = { userId: viewer.userId, visitorMarker: viewer.visitorMarker };

      // Ни учётной записи, ни маркера: искать право не по чему. Так бывает
      // у запроса без токена - страницу открыли раньше, чем выдался токен.
      if (who.userId === null && !who.visitorMarker) {
        return { allowed: false, reason: 'not-entitled' };
      }

      if (await source.covered(video.id, who, now())) return { allowed: true };

      // Права нет - значит нужен доступ, и учётная запись тут ни при чём:
      // код открывает запись предъявителю, а право ложится на его маркер.
      return { allowed: false, reason: 'not-entitled' };
    },
  };
}
