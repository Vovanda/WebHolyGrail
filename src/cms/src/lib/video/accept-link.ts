import type { Payload } from 'payload';

import { redeemLink, type LinkResource } from './redeem-link';
import { accessTarget } from './resource-field';
import { writeEntitlement, type GrantHolder } from './write-entitlement';

/**
 * Приём ссылки-приглашения: найти, погасить, записать право.
 *
 * @remarks
 * Сценарий целиком, без HTTP: обработчику остаётся прочитать тело запроса
 * и разложить исход по кодам ответа. Так проверяется он без сети — на живой
 * базе, но одним вызовом.
 *
 * Решение о том, открывает ли ссылка, принимает чистая `redeemLink`; здесь
 * только то, ради чего нужна база: найти запись по адресу, отметить
 * срабатывание и записать выданное право.
 */

export interface AcceptLinkArgs {
  readonly payload: Payload;
  /** Адрес ссылки — то, что стоит в присланном приглашении. */
  readonly token: string;
  readonly holder: GrantHolder;
  readonly now: Date;
}

export type AcceptLinkResult =
  | {
      readonly ok: true;
      readonly resource: LinkResource;
      /** До какой даты выдано право; `null` — бессрочно. */
      readonly grantedUntil: string | null;
    }
  | {
      readonly ok: false;
      readonly reason: 'not-found' | 'expired' | 'revoked' | 'used-up';
    };

/** Запись ссылки в том виде, в каком её отдаёт база. */
interface LinkDoc {
  readonly id: string | number;
  readonly resource?: { relationTo?: string; value?: unknown } | null;
  readonly revoked?: boolean | null;
  readonly maxUses?: number | null;
  readonly usedCount?: number | null;
  readonly expiresAt?: string | null;
  readonly grantDays?: number | null;
}

/**
 * Связь, умеющая два вида объектов, приходит парой «куда» и «что».
 *
 * @remarks
 * С глубиной ноль во втором поле лежит номер, с большей — сам документ.
 * Берём номер в обоих случаях: ничего, кроме него, сценарию не нужно.
 */
export async function acceptLink({
  payload,
  token,
  holder,
  now,
}: AcceptLinkArgs): Promise<AcceptLinkResult> {
  const found = await payload.find({
    collection: 'access-links',
    where: { token: { equals: token } },
    depth: 0,
    limit: 1,
    overrideAccess: true,
  });

  const doc = found.docs[0] as LinkDoc | undefined;
  const resource = doc ? accessTarget(doc.resource) : null;

  const verdict = redeemLink({
    link:
      doc && resource
        ? {
            id: doc.id,
            resource,
            revoked: doc.revoked === true,
            maxUses: doc.maxUses ?? null,
            usedCount: doc.usedCount ?? 0,
            // Срок у ссылки обязателен, но запись могла прийти из прежних данных:
            // пустой читается как просроченный, а не как бессрочный.
            expiresAt: doc.expiresAt ?? '',
            grantDays: doc.grantDays ?? null,
          }
        : null,
    viewerId: holder.kind === 'account' ? holder.userId : null,
    now,
  });

  if (!verdict.ok) return verdict;

  // Счётчик растёт только после того, как ссылка признана годной, но до записи
  // права: иначе одна и та же ссылка, нажатая дважды подряд, сработала бы
  // сверх своего предела.
  await payload.update({
    collection: 'access-links',
    id: doc!.id,
    data: { usedCount: (doc!.usedCount ?? 0) + 1 },
    overrideAccess: true,
  });

  await writeEntitlement({
    payload,
    holder,
    target: { collection: verdict.resource.kind, id: verdict.resource.id },
    grantedUntil: verdict.expiresAt,
    source: 'invite',
    note: `Ссылка ${token.slice(0, 6)}…`,
  });

  return { ok: true, resource: verdict.resource, grantedUntil: verdict.expiresAt };
}
