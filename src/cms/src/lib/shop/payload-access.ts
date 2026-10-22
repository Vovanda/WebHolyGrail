import type { Payload, PayloadRequest } from 'payload';

import { generateAccessCode } from '../video/access-code';
import type { AccessPort } from './ports';

/**
 * Выдача доступа к видео для магазина - на кодах движка (docs/whg/41-access.md).
 *
 * @remarks
 * Оплаченная строка получает одноразовый код к доступу позиции; покупатель
 * вводит его как любой другой код. Срок задаётся явно: без него коллекция
 * кодов ставит срок по умолчанию из настроек - минуты, - и оплаченный код
 * истекал бы раньше, чем покупатель откроет страницу заказа. Отзыв помечает код и снимает права, открытые
 * по нему: право хранит значение кода в `sourceRef`.
 */
/** Сколько дней оплаченный код ждёт активации. Открытое им право живёт по своим правилам. */
export const PURCHASED_CODE_DAYS = 30;

export function payloadAccess(payload: Payload) {
  return (req?: PayloadRequest): AccessPort => {
    const opts = { overrideAccess: true, depth: 0, ...(req ? { req } : {}) } as const;
    return {
      issue: async (access) => {
        // Значение не должно совпасть с живым кодом: при совпадении берём новое.
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const code = generateAccessCode(8);
          const clash = await payload.find({
            collection: 'media-access-codes',
            where: { code: { equals: code } },
            limit: 1,
            ...opts,
          });
          if (clash.docs.length > 0) continue;
          const doc = await payload.create({
            collection: 'media-access-codes',
            data: {
              code,
              access,
              maxUses: 1,
              usedCount: 0,
              label: 'Оплата заказа',
              expiresAt: new Date(Date.now() + PURCHASED_CODE_DAYS * 86_400_000).toISOString(),
            } as never,
            ...opts,
          });
          return { codeId: doc.id, code };
        }
        throw new Error('Не удалось выпустить код доступа: пять совпадений подряд');
      },
      revoke: async ({ codeId, code }) => {
        await payload.update({
          collection: 'media-access-codes',
          id: codeId,
          data: { revoked: true } as never,
          ...opts,
        });
        await payload.delete({
          collection: 'media-access-rights',
          where: { sourceRef: { equals: code } },
          ...opts,
        });
      },
    };
  };
}
