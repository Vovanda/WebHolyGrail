/**
 * Погашение кода доступа.
 *
 * @remarks
 * Код — способ выдачи права, а не отдельный вид доступа: сработав, он
 * превращается в обычное право «зритель × набор». Поэтому здесь решается
 * только одно — можно ли его сейчас погасить и на какой срок он откроет
 * набор.
 *
 * Функция чистая: ей передают уже прочитанный код и текущего зрителя. Так все
 * случаи — просрочка, исчерпанный лимит, требование входа, повторное
 * погашение — проверяются без базы.
 */

export interface AccessCode {
  readonly id: string | number;
  readonly playlistId: string | number;
  readonly requiresSignIn: boolean;
  readonly maxUses: number | null;
  readonly usedCount: number;
  readonly expiresAt: string | null;
  /** На сколько дней открывает доступ; `null` — навсегда. */
  readonly grantDays: number | null;
}

export type RedeemResult =
  | {
      readonly ok: true;
      readonly playlistId: string | number;
      /** До какой даты действует выданное право; `null` — бессрочно. */
      readonly expiresAt: string | null;
      /** Куда записать право: за учётной записью или за браузером. */
      readonly bind: 'account' | 'session';
    }
  | {
      readonly ok: false;
      readonly reason: 'not-found' | 'expired' | 'used-up' | 'sign-in-required';
    };

export interface RedeemArgs {
  readonly code: AccessCode | null;
  readonly viewerId: string | number | null;
  readonly now: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

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

  // Требование входа проверяем последним: человеку, который всё равно упрётся
  // в просроченный код, незачем сначала регистрироваться.
  if (code.requiresSignIn && viewerId === null) {
    return { ok: false, reason: 'sign-in-required' };
  }

  const expiresAt =
    code.grantDays === null
      ? null
      : new Date(now.getTime() + code.grantDays * DAY_MS).toISOString();

  return {
    ok: true,
    playlistId: code.playlistId,
    expiresAt,
    bind: viewerId === null ? 'session' : 'account',
  };
}
