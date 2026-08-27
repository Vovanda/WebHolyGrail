/**
 * Что сделать с правом вошедшего зрителя: завести или продлить.
 *
 * @remarks
 * Погашённый код кладёт право в токен, а токен живёт в браузере: на другом
 * устройстве или после чистки данных человек остаётся ни с чем и идёт за новым
 * кодом. У вошедшего есть за кем закрепить право, поэтому оно пишется в базу.
 *
 * Повторное погашение того же кода не заводит вторую запись: право продлевается.
 * Иначе у зрителя копились бы одинаковые права, и понять по списку, что у него
 * открыто, стало бы нельзя.
 *
 * Бессрочное право короче не делаем: код на неделю не должен обрезать
 * подаренный навсегда доступ.
 */
export interface ExistingGrant {
  readonly id: string | number;
  /** Пусто - бессрочно. */
  readonly expiresAt?: string | null;
}

export type GrantPlan =
  | { readonly kind: 'create'; readonly expiresAt: string | null }
  | { readonly kind: 'extend'; readonly id: string | number; readonly expiresAt: string | null }
  | { readonly kind: 'keep' };

export function planEntitlement(
  existing: ExistingGrant | null | undefined,
  grantedUntil: string | null,
): GrantPlan {
  if (!existing) return { kind: 'create', expiresAt: grantedUntil };

  // Уже бессрочно - трогать нечего.
  if (!existing.expiresAt) return { kind: 'keep' };

  // Новое право бессрочно - оно и остаётся.
  if (!grantedUntil) return { kind: 'extend', id: existing.id, expiresAt: null };

  const had = new Date(existing.expiresAt).getTime();
  const next = new Date(grantedUntil).getTime();

  // Негодная дата в базе: доверяем новой, иначе право осталось бы сломанным.
  if (Number.isNaN(had)) return { kind: 'extend', id: existing.id, expiresAt: grantedUntil };
  if (Number.isNaN(next)) return { kind: 'keep' };

  return next > had
    ? { kind: 'extend', id: existing.id, expiresAt: grantedUntil }
    : { kind: 'keep' };
}
