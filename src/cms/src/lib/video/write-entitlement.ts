import type { Payload, Where } from 'payload';

import { planEntitlement } from './keep-entitlement';

/**
 * Запись права в базу: завести новое или продлить уже выданное.
 *
 * @remarks
 * Отделено от того, кто это право выдал. Код, оплата и рука владельца приводят
 * к одному и тому же - записи «этому зрителю открыт этот доступ до такого-то
 * числа», - и решать, заводить её или продлевать, каждому из них по-своему
 * незачем.
 *
 * Решение принимает `planEntitlement`, здесь оно применяется. Разделены они
 * затем, что решение проверяется без базы, а применение без решения не имеет
 * своих правил.
 */

/** Чем держится право: учётной записью или маркером посетителя из токена. */
export type GrantHolder =
  | { readonly kind: 'account'; readonly userId: string | number }
  | { readonly kind: 'identity'; readonly visitorMarker: string };

/**
 * На какой доступ выдаётся право.
 *
 * @remarks
 * Право лежит на доступе, а не на материале: что именно откроется, знает сам
 * доступ, и поменяется его состав - поменяется открытое, без единой правки
 * в выданных правах.
 */
export interface GrantTarget {
  readonly accessId: string | number;
}

export interface WriteGrantArgs {
  readonly payload: Payload;
  readonly holder: GrantHolder;
  readonly target: GrantTarget;
  /** До какой даты действует; `null` — бессрочно. */
  readonly grantedUntil: string | null;
  readonly source: 'manual' | 'payment' | 'invite' | 'promo';
  readonly note?: string;
}

/** Что вышло: пригодится тому, кто захочет отличить новую выдачу от продления. */
export type WriteGrantResult = 'created' | 'extended' | 'kept';

const holderWhere = (holder: GrantHolder): Where =>
  holder.kind === 'account'
    ? { viewer: { equals: holder.userId } }
    : { visitorMarker: { equals: holder.visitorMarker } };

const holderData = (holder: GrantHolder): Record<string, unknown> =>
  holder.kind === 'account' ? { viewer: holder.userId } : { visitorMarker: holder.visitorMarker };

export async function writeEntitlement({
  payload,
  holder,
  target,
  grantedUntil,
  source,
  note,
}: WriteGrantArgs): Promise<WriteGrantResult> {
  // Тем же кодом пользуются снова - с другого устройства или после чистки
  // данных. Права от этого плодиться не должны: одинаковые записи в списке
  // не дают понять, что у зрителя открыто.
  const already = await payload.find({
    collection: 'media-access-rights',
    where: {
      and: [holderWhere(holder), { access: { equals: target.accessId } }],
    },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });

  const existing = already.docs[0] as
    | { id: string | number; expiresAt?: string | null }
    | undefined;
  const plan = planEntitlement(existing ?? null, grantedUntil);

  if (plan.kind === 'create') {
    await payload.create({
      collection: 'media-access-rights',
      data: {
        ...holderData(holder),
        access: Number(target.accessId),
        source,
        expiresAt: plan.expiresAt,
        ...(note ? { note } : {}),
      },
      overrideAccess: true,
    });
    return 'created';
  }

  if (plan.kind === 'extend') {
    await payload.update({
      collection: 'media-access-rights',
      id: plan.id,
      data: { expiresAt: plan.expiresAt },
      overrideAccess: true,
    });
    return 'extended';
  }

  return 'kept';
}
