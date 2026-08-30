import type { Payload, Where } from 'payload';

import { planEntitlement } from './keep-entitlement';

/**
 * Запись права в базу: завести новое или продлить уже выданное.
 *
 * @remarks
 * Отделено от того, кто это право выдал. Код, оплата и рука владельца приводят
 * к одному и тому же - записи «этому зрителю открыт этот ресурс до такого-то
 * числа», - и решать, заводить её или продлевать, каждому из них по-своему
 * незачем.
 *
 * Решение принимает `planEntitlement`, здесь оно применяется. Разделены они
 * затем, что решение проверяется без базы, а применение без решения не имеет
 * своих правил.
 */

/** Чем держится право: учётной записью или идентичностью из токена. */
export type GrantHolder =
  | { readonly kind: 'account'; readonly userId: string | number }
  | { readonly kind: 'identity'; readonly ref: string };

/** На что выдаётся право. */
export interface GrantTarget {
  readonly collection: 'playlists' | 'media';
  readonly id: string | number;
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
    : { ref: { equals: holder.ref } };

const holderData = (holder: GrantHolder): Record<string, unknown> =>
  holder.kind === 'account' ? { viewer: holder.userId } : { ref: holder.ref };

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
    collection: 'entitlements',
    where: {
      and: [
        holderWhere(holder),
        { 'resource.value': { equals: Number(target.id) } },
        { 'resource.relationTo': { equals: target.collection } },
      ],
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
      collection: 'entitlements',
      data: {
        ...holderData(holder),
        resource: { relationTo: target.collection, value: Number(target.id) },
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
      collection: 'entitlements',
      id: plan.id,
      data: { expiresAt: plan.expiresAt },
      overrideAccess: true,
    });
    return 'extended';
  }

  return 'kept';
}
