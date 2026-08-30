/**
 * Погашение ссылки-приглашения.
 *
 * @remarks
 * Ссылка, как и код, — способ выдачи права: сработав, она превращается в обычное
 * право «зритель × подборка или запись». Поэтому здесь решается только одно —
 * открывает ли она сейчас и на какой срок.
 *
 * Отдельно от кода, потому что свойства разные: у ссылки срок обязателен и есть
 * отзыв, а её адрес длинный и машинный - короткий подобрали бы перебором. Код же
 * диктуют вслух, поэтому он короткий и в алфавите без похожих начертаний.
 *
 * Функция чистая: ей передают уже прочитанную ссылку и текущего зрителя, поэтому
 * просрочка, отзыв и исчерпанный предел проверяются без базы.
 */

export interface AccessLink {
  readonly id: string | number;
  /** От какого доступа выдана ссылка. */
  readonly accessId: string | number;
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
      readonly accessId: string | number;
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
    accessId: link.accessId,
    expiresAt,
    bind: viewerId === null ? 'identity' : 'account',
  };
}
