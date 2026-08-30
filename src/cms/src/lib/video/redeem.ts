/**
 * Погашение кода доступа.
 *
 * @remarks
 * Код — способ выдачи права, а не отдельный вид доступа: сработав, он
 * превращается в обычное право «зритель × плейлист». Поэтому здесь решается
 * только одно — можно ли его сейчас погасить, на какой срок он откроет
 * плейлист и чем это право будет держаться.
 *
 * Функция чистая: ей передают уже прочитанный код и текущего зрителя. Так все
 * случаи — просрочка, исчерпанный лимит, требование входа, повторное
 * погашение — проверяются без базы.
 */

/** На что открывает код: подборка целиком или одна запись. */
export interface CodeResource {
  readonly kind: 'playlists' | 'media';
  readonly id: string | number;
}

export interface AccessCode {
  readonly id: string | number;
  readonly resource: CodeResource;
  readonly maxUses: number | null;
  readonly usedCount: number;
  readonly expiresAt: string | null;
  /** На сколько дней открывает доступ; `null` — навсегда. */
  readonly grantDays: number | null;
  /** Срок в минутах: если задан, он главнее дней. */
  readonly grantMinutes?: number | null;
}

export type RedeemResult =
  | {
      readonly ok: true;
      readonly resource: CodeResource;
      /** До какой даты действует выданное право; `null` — бессрочно. */
      readonly expiresAt: string | null;
      /**
       * Чем держится выданное право: учётной записью или идентичностью.
       *
       * @remarks
       * Записывается оно в обоих случаях - разница только в том, по чему потом
       * находится. Пока право у не вошедшего лежало в токене и записи не имело,
       * отозвать его было нельзя ни при каком желании.
       */
      readonly bind: 'account' | 'identity';
    }
  | {
      readonly ok: false;
      readonly reason: 'not-found' | 'expired' | 'used-up';
    };

export interface RedeemArgs {
  readonly code: AccessCode | null;
  readonly viewerId: string | number | null;
  readonly now: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export function redeemCode({ code, viewerId, now }: RedeemArgs): RedeemResult {
  if (!code) return { ok: false, reason: 'not-found' };

  // Сначала срок, потом лимит: просроченный код бессмыслен, даже если
  // срабатываний осталось много.
  if (code.expiresAt) {
    const until = new Date(code.expiresAt).getTime();
    if (Number.isNaN(until) || until <= now.getTime()) return { ok: false, reason: 'expired' };
  }

  if (code.maxUses !== null && code.usedCount >= code.maxUses) {
    return { ok: false, reason: 'used-up' };
  }

  /*
    Срок доступа считается в минутах, если они заданы: у показа и вебинара он
    короче суток, а дробить дни было бы враньём в названии поля. Дни остаются
    обычным случаем - подписка и подарок меряются ими.
  */
  const grantMs =
    typeof code.grantMinutes === 'number' && code.grantMinutes > 0
      ? code.grantMinutes * MINUTE_MS
      : code.grantDays === null
        ? null
        : code.grantDays * DAY_MS;

  const expiresAt = grantMs === null ? null : new Date(now.getTime() + grantMs).toISOString();

  return {
    ok: true,
    resource: code.resource,
    expiresAt,
    bind: viewerId === null ? 'identity' : 'account',
  };
}
