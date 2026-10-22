import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload';

import type { HowToBuy, OfferSnapshot, OrderLine, OrderStatus } from 'contracts';

import { moneyPort } from './money';
import { type Execute, returnStock, takeStock } from './stock';
import type {
  Id,
  InvoiceLine,
  IssuedCode,
  OfferCard,
  ShopPorts,
  StoredInvoice,
  StoredOrder,
} from './ports';

/**
 * Порты магазина на Payload - единственное место модуля, которое знает о CMS.
 *
 * @remarks
 * Суммы в базе - целые микроединицы учёта в полях с единицей в имени
 * (`priceMicros`, `totalMicros`), сценарии получают их под предметными именами.
 * Связи приходят то номером, то документом; здесь они сводятся к номеру.
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
const howToBuy = (v: unknown): HowToBuy => (v === 'request' ? 'request' : 'cart');
const micros = (v: unknown): number | null =>
  typeof v === 'number' && Number.isSafeInteger(v) ? v : null;

export function offerFromDoc(doc: Record<string, unknown>): OfferSnapshot {
  return {
    id: Number(doc['id']),
    title: str(doc['title']),
    price: micros(doc['priceMicros']),
    stock: typeof doc['stock'] === 'number' ? doc['stock'] : null,
    access: idOf(doc['access']),
    howToBuy: howToBuy(doc['howToBuy']),
    deposit: micros(doc['depositMicros']),
  };
}

export function cardFromDoc(doc: Record<string, unknown>): OfferCard {
  return {
    id: Number(doc['id']),
    title: str(doc['title']),
    price: micros(doc['priceMicros']),
    stock: typeof doc['stock'] === 'number' ? doc['stock'] : null,
    summary: typeof doc['summary'] === 'string' ? doc['summary'] : null,
    image: doc['image'] ?? null,
    howToBuy: howToBuy(doc['howToBuy']),
    deposit: micros(doc['depositMicros']),
  };
}

const lineFromDoc = (l: Record<string, unknown>): InvoiceLine => ({
  offer: idOf(l['offer']),
  title: str(l['title']),
  quantity: Number(l['quantity']),
  price: Number(l['priceMicros']),
  sum: Number(l['sumMicros']),
  access: idOf(l['access']),
});

export function orderFromDoc(doc: Record<string, unknown>): StoredOrder {
  const buyer = (doc['buyer'] ?? {}) as Record<string, unknown>;
  return {
    id: doc['id'] as Id,
    status: doc['status'] as OrderStatus,
    lines: ((doc['lines'] ?? []) as Record<string, unknown>[]).map(
      (l) =>
        ({
          ...lineFromDoc(l),
          offer: Number(idOf(l['offer'])),
          mode: howToBuy(l['mode']),
          deposit: micros(l['depositMicros']),
        }) as OrderLine,
    ),
    total: Number(doc['totalMicros']),
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
    purpose: doc['purpose'] === 'deposit' ? 'deposit' : 'payment',
    status: doc['status'] as StoredInvoice['status'],
    refundOf: idOf(doc['refundOf']),
    lines: ((doc['lines'] ?? []) as Record<string, unknown>[]).map(lineFromDoc),
    total: Number(doc['totalMicros']),
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

export const lineToDoc = (l: InvoiceLine | OrderLine) => ({
  offer: l.offer,
  title: l.title,
  quantity: l.quantity,
  priceMicros: l.price,
  sumMicros: l.sum,
  access: l.access,
  ...('mode' in l ? { mode: l.mode, depositMicros: l.deposit } : {}),
});

/** Документ под запись: суммы - в поля с единицей в имени. */
function withTotal<T extends { total?: number }>(
  doc: T,
): Omit<T, 'total'> & { totalMicros?: number } {
  const { total, ...rest } = doc;
  return total === undefined ? rest : { ...rest, totalMicros: total };
}

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
      cards: async (query) => {
        const ids =
          'ids' in query
            ? [...new Set(query.ids.filter((id) => Number.isInteger(id) && id > 0))]
            : null;
        if (ids?.length === 0) return [];
        const found = await payload.find({
          collection: 'offers',
          ...(ids ? { where: { id: { in: ids } } } : {}),
          limit: ids ? ids.length : Math.min(Math.max(1, 'limit' in query ? query.limit : 1), 100),
          sort: 'title',
          pagination: false,
          ...opts,
          depth: 1,
        });
        return found.docs.map((d) => cardFromDoc(d as unknown as Record<string, unknown>));
      },
      take: (lines) => takeStock(execute(payload), lines),
      giveBack: (lines) => returnStock(execute(payload), lines),
    },
    orders: {
      create: async (o) => {
        const doc = await payload.create({
          collection: 'orders',
          data: { ...withTotal(o), lines: o.lines.map(lineToDoc) } as never,
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
          data: { ...withTotal(i), lines: i.lines.map(lineToDoc), codes: [...i.codes] } as never,
          ...opts,
        });
        return invoiceFromDoc(doc as unknown as Record<string, unknown>);
      },
      update: async (id, patch) => {
        const data: Record<string, unknown> = { ...withTotal(patch) };
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
    money: moneyPort(),
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
