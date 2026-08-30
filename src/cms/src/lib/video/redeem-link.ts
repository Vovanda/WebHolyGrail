/**
 * Погашение ссылки-приглашения.
 *
 * @remarks
 * Ссылка, как и код, — способ выдачи права: сработав, она превращается в обычное
 * право «зритель × подборка или запись». Поэтому здесь решается только одно —
 * открывает ли она сейчас и на какой срок.
 *
 * Отдельно от погашения кода, потому что правила разные. Код спрашивает про вход:
 * он выдан человеку, и владелец решает, закреплять ли доступ за учётной записью.
 * Ссылка входа не требует по своей природе — она не про «кому», а про «всякому,
 * у кого есть адрес», — зато её отзывают, не дожидаясь срока, когда адрес ушёл
 * не туда.
 *
 * Функция чистая: ей передают уже прочитанную ссылку и текущего зрителя, поэтому
 * просрочка, отзыв и исчерпанный предел проверяются без базы.
 */

/** На что открывает ссылка: подборка целиком или одна запись. */
export interface LinkResource {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

export interface AccessLink {
  readonly id: string | number;
  readonly resource: LinkResource;
  readonly revoked: boolean;
  readonly maxUses: number | null;
  readonly usedCount: number;
  /** Срок обязателен: бессрочная ссылка открывает подборку навсегда. */
  readonly expiresAt: string;
  /** На сколько дней открывает выданное право; `null` — навсегда. */
  readonly grantDays: number | null;
}

export type RedeemLinkResult =
  | {
      readonly ok: true;
      readonly resource: LinkResource;
      /** До какой даты действует выданное право; `null` — бессрочно. */
      readonly expiresAt: string | null;
      /**
       * Чем держится выданное право.
       *
       * @remarks
       * Вошедшему оно закрепляется за учётной записью и остаётся с ним на любом
       * устройстве; остальным — за идентичностью браузера. Записывается право
       * в обоих случаях, разница только в том, по чему потом находится.
       */
      readonly bind: 'account' | 'identity';
    }
  | {
      readonly ok: false;
      readonly reason: 'not-found' | 'expired' | 'revoked' | 'used-up';
    };

export interface RedeemLinkArgs {
  readonly link: AccessLink | null;
  readonly viewerId: string | number | null;
  readonly now: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function redeemLink({ link, viewerId, now }: RedeemLinkArgs): RedeemLinkResult {
  if (!link) return { ok: false, reason: 'not-found' };

  // Отзыв проверяется первым: он означает, что адрес ушёл не туда, и такой
  // ссылке нечего сообщать про остаток срока или срабатываний.
  if (link.revoked) return { ok: false, reason: 'revoked' };

  const until = new Date(link.expiresAt).getTime();
  if (Number.isNaN(until) || until <= now.getTime()) return { ok: false, reason: 'expired' };

  if (link.maxUses !== null && link.usedCount >= link.maxUses) {
    return { ok: false, reason: 'used-up' };
  }

  const expiresAt =
    link.grantDays === null
      ? null
      : new Date(now.getTime() + link.grantDays * DAY_MS).toISOString();

  return {
    ok: true,
    resource: link.resource,
    expiresAt,
    bind: viewerId === null ? 'identity' : 'account',
  };
}
