import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload';

import type { OfferSnapshot, OrderLine, OrderStatus } from 'contracts';

import { type Execute, returnStock, takeStock } from './stock';
import type { Id, InvoiceLine, IssuedCode, ShopPorts, StoredInvoice, StoredOrder } from './ports';

/**
 * Порты магазина на Payload - единственное место модуля, которое знает о CMS.
 *
 * @remarks
 * Цена позиции хранится в рублях (её вводит владелец), сценарии считают в
 * копейках - перевод здесь. Связи приходят то номером, то документом; здесь
 * же они сводятся к номеру.
 *
 * Остаток списывается условной записью в базе (`stock.ts`): двойной продажи нет
 * и между процессами. Транзакции Payload в движке сейчас пустые (#155), поэтому
 * сценарии сами возвращают списанное при сбое; общий замок в процессе оставлен,
 * чтобы сценарии одного процесса не перемежались.
 */

const idOf = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') return Number((v as { id: unknown }).id);
  return Number(v);
};
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const kopecks = (rub: unknown): number | null =>
  typeof rub === 'number' && Number.isFinite(rub) ? Math.round(rub * 100) : null;

export function offerFromDoc(doc: Record<string, unknown>): OfferSnapshot {
  return {
    id: Number(doc['id']),
    title: str(doc['title']),
    price: kopecks(doc['price']),
    stock: typeof doc['stock'] === 'number' ? doc['stock'] : null,
    access: idOf(doc['access']),
  };
}

const lineFromDoc = (l: Record<string, unknown>): InvoiceLine => ({
  offer: idOf(l['offer']),
  title: str(l['title']),
  quantity: Number(l['quantity']),
  price: Number(l['price']),
  sum: Number(l['sum']),
  access: idOf(l['access']),
});

export function orderFromDoc(doc: Record<string, unknown>): StoredOrder {
  const buyer = (doc['buyer'] ?? {}) as Record<string, unknown>;
  return {
    id: doc['id'] as Id,
    status: doc['status'] as OrderStatus,
    lines: ((doc['lines'] ?? []) as Record<string, unknown>[]).map(
      (l) => ({ ...lineFromDoc(l), offer: Number(idOf(l['offer'])) }) as OrderLine,
    ),
    total: Number(doc['total']),
    buyer: {
      name: str(buyer['name']),
      phone: str(buyer['phone']),
      email: str(buyer['email']),
      comment: str(buyer['comment']),
    },
    secretHash: str(doc['secretHash']),
    createdAt: str(doc['createdAt']),
  };
}

export function invoiceFromDoc(doc: Record<string, unknown>): StoredInvoice {
  return {
    id: doc['id'] as Id,
    order: idOf(doc['order']),
    kind: doc['kind'] as StoredInvoice['kind'],
    status: doc['status'] as StoredInvoice['status'],
    refundOf: idOf(doc['refundOf']),
    lines: ((doc['lines'] ?? []) as Record<string, unknown>[]).map(lineFromDoc),
    total: Number(doc['total']),
    dueAt: typeof doc['dueAt'] === 'string' ? doc['dueAt'] : null,
    codes: ((doc['codes'] ?? []) as Record<string, unknown>[]).map(
      (c): IssuedCode => ({
        line: Number(c['line']),
        codeId: str(c['codeId']),
        code: str(c['code']),
      }),
    ),
  };
}

const lineToDoc = (l: InvoiceLine | OrderLine) => ({
  offer: l.offer,
  title: l.title,
  quantity: l.quantity,
  price: l.price,
  sum: l.sum,
  access: l.access,
});

/**
 * Прямая запись в базу для условного списания остатка: через Payload её не
 * выразить. Единственное место модуля с SQL, рядом с адаптером (R8).
 */
const execute =
  (payload: Payload): Execute =>
  async (sql, args) => {
    const client = (
      payload.db as unknown as {
        client: { execute(q: { sql: string; args: number[] }): Promise<{ rowsAffected: number }> };
      }
    ).client;
    const result = await client.execute({ sql, args: [...args] });
    return result.rowsAffected;
  };

let queue: Promise<unknown> = Promise.resolve();

/** Выполняет работу после всех начатых раньше: одна запись магазина за раз. */
function serial<T>(work: () => Promise<T>): Promise<T> {
  const run = queue.then(work, work);
  queue = run.catch(() => undefined);
  return run;
}

/**
 * Порты на Payload.
 *
 * @param access - выдача кодов доступа к видео; строится от того же запроса,
 *   чтобы код писался в ту же транзакцию, что и счёт.
 */
export function payloadPorts(
  payload: Payload,
  access: (req?: PayloadRequest) => ShopPorts['access'],
  req?: PayloadRequest,
): ShopPorts {
  const opts = { overrideAccess: true, depth: 0, ...(req ? { req } : {}) } as const;

  const ports: ShopPorts = {
    offers: {
      snapshots: async (ids) => {
        const clean = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
        if (clean.length === 0) return [];
        const found = await payload.find({
          collection: 'offers',
          where: { id: { in: clean } },
          limit: clean.length,
          pagination: false,
          ...opts,
        });
        return found.docs.map((d) => offerFromDoc(d as unknown as Record<string, unknown>));
      },
      take: (lines) => takeStock(execute(payload), lines),
      giveBack: (lines) => returnStock(execute(payload), lines),
    },
    orders: {
      create: async (o) => {
        const doc = await payload.create({
          collection: 'orders',
          data: { ...o, lines: o.lines.map(lineToDoc) } as never,
          ...opts,
        });
        return orderFromDoc(doc as unknown as Record<string, unknown>);
      },
      get: async (id) => {
        const doc = await payload.findByID({ collection: 'orders', id, ...opts }).catch(() => null);
        return doc ? orderFromDoc(doc as unknown as Record<string, unknown>) : null;
      },
      bySecretHash: async (hash) => {
        if (!hash) return null;
        const found = await payload.find({
          collection: 'orders',
          where: { secretHash: { equals: hash } },
          limit: 1,
          ...opts,
        });
        const doc = found.docs[0];
        return doc ? orderFromDoc(doc as unknown as Record<string, unknown>) : null;
      },
      setStatus: async (id, status) => {
        await payload.update({ collection: 'orders', id, data: { status }, ...opts });
      },
      newBefore: async (before) => {
        const found = await payload.find({
          collection: 'orders',
          where: {
            and: [
              { status: { equals: 'new' } },
              { createdAt: { less_than: before.toISOString() } },
            ],
          },
          limit: 100,
          ...opts,
        });
        return found.docs.map((d) => d.id);
      },
    },
    invoices: {
      forOrder: async (order) => {
        const found = await payload.find({
          collection: 'invoices',
          where: { order: { equals: order } },
          limit: 100,
          pagination: false,
          ...opts,
        });
        return found.docs.map((d) => invoiceFromDoc(d as unknown as Record<string, unknown>));
      },
      get: async (id) => {
        const doc = await payload
          .findByID({ collection: 'invoices', id, ...opts })
          .catch(() => null);
        return doc ? invoiceFromDoc(doc as unknown as Record<string, unknown>) : null;
      },
      create: async (i) => {
        const doc = await payload.create({
          collection: 'invoices',
          data: { ...i, lines: i.lines.map(lineToDoc), codes: [...i.codes] } as never,
          ...opts,
        });
        return invoiceFromDoc(doc as unknown as Record<string, unknown>);
      },
      update: async (id, patch) => {
        const data: Record<string, unknown> = { ...patch };
        if (patch.lines) data['lines'] = patch.lines.map(lineToDoc);
        if (patch.codes)
          data['codes'] = patch.codes.map((c) => ({ ...c, codeId: String(c.codeId) }));
        await payload.update({ collection: 'invoices', id, data: data as never, ...opts });
      },
      remove: async (id) => {
        await payload.delete({ collection: 'invoices', id, ...opts });
      },
    },
    access: access(req),
    now: () => new Date(),
    transaction: (work) => {
      // Внутри открытой транзакции вложенный сценарий идёт в ней же: второй
      // заход в замок ждал бы сам себя.
      if (req) return work(ports);
      return serial(async () => {
        const txReq = await createLocalReq({}, payload);
        const own = await initTransaction(txReq);
        try {
          const result = await work(payloadPorts(payload, access, txReq));
          const failed =
            result &&
            typeof result === 'object' &&
            'ok' in result &&
            (result as { ok: unknown }).ok === false;
          if (own) await (failed ? killTransaction(txReq) : commitTransaction(txReq));
          return result;
        } catch (error) {
          if (own) await killTransaction(txReq);
          throw error;
        }
      });
    },
  };
  return ports;
}
