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

/**
 * Чем узнаётся человек: всем, что о нём известно на этот момент.
 *
 * @remarks
 * Признаков бывает несколько сразу: вошедший приходит и с маркером браузера.
 * Право у него одно, поэтому и передаются они вместе.
 */
export interface GrantHolder {
  readonly userId?: string | number | undefined;
  readonly visitorMarker?: string | undefined;
  readonly phone?: string | undefined;
  readonly email?: string | undefined;
}

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
  /** Чем именно выдано: код или номер платежа. Пусто у выданного вручную. */
  readonly sourceRef?: string | undefined;
  readonly note?: string;
}

/** Что вышло: пригодится тому, кто захочет отличить новую выдачу от продления. */
export type WriteGrantResult = 'created' | 'extended' | 'kept';

/**
 * Условия «это тот же человек»: совпало хоть по одному признаку.
 *
 * @remarks
 * Ищем сразу по всем, иначе вошедший заводит второе право рядом с тем, что
 * лежало на маркере, и один покупатель выглядит в списке двумя.
 */
const holderWhere = (holder: GrantHolder): Where[] => {
  const ways: Where[] = [];
  if (holder.userId !== undefined && holder.userId !== null) {
    ways.push({ viewer: { equals: holder.userId } });
  }
  if (holder.visitorMarker) ways.push({ visitorMarker: { equals: holder.visitorMarker } });
  if (holder.phone) ways.push({ phone: { equals: holder.phone } });
  if (holder.email) ways.push({ email: { equals: holder.email } });
  return ways;
};

/** Всё известное записывается: в следующий раз человек найдётся любым признаком. */
const holderData = (holder: GrantHolder): Record<string, unknown> => {
  const data: Record<string, unknown> = {};
  if (holder.userId !== undefined && holder.userId !== null) data['viewer'] = holder.userId;
  if (holder.visitorMarker) data['visitorMarker'] = holder.visitorMarker;
  if (holder.phone) data['phone'] = holder.phone;
  if (holder.email) data['email'] = holder.email;
  return data;
};

export async function writeEntitlement({
  payload,
  holder,
  target,
  grantedUntil,
  source,
  sourceRef,
  note,
}: WriteGrantArgs): Promise<WriteGrantResult> {
  // Тем же кодом пользуются снова - с другого устройства или после чистки
  // данных. Права от этого плодиться не должны: одинаковые записи в списке
  // не дают понять, что у зрителя открыто.
  const ways = holderWhere(holder);
  const already = await payload.find({
    collection: 'media-access-rights',
    where: { and: [{ or: ways }, { access: { equals: target.accessId } }] },
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
        ...(sourceRef ? { sourceRef } : {}),
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
