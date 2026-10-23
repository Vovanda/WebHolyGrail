import {
  commitTransaction,
  createLocalReq,
  initTransaction,
  killTransaction,
  type Payload,
  type PayloadRequest,
} from 'payload';

import {
  type HowToBuy,
  type OfferSnapshot,
  type OrderLine,
  type OrderStatus,
  shopSettings,
  cleanCharacteristics,
  currentPrice,
  EXTRA_KINDS,
  type ExtraKind,
  type ExtraLine,
  publicSpecs,
  type SpecValue,
} from 'contracts';

import { moneyPort } from './money';
import { type Execute, returnStock, takeStock } from './stock';
import type {
  Id,
  InvoiceLine,
  OfferCard,
  OfferDetailCard,
  ShopPorts,
  StoredInvoice,
  StoredOrder,
} from './ports';
import { SECTION_CAP } from './ports';

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

/** Цена позиции сейчас с учётом акции (ADR-007). */
const priceOf = (doc: Record<string, unknown>, now: Date) =>
  currentPrice(
    micros(doc['priceMicros']),
    micros(doc['promoPriceMicros']),
    typeof doc['promoUntil'] === 'string' ? doc['promoUntil'] : null,
    now,
  );

export function offerFromDoc(doc: Record<string, unknown>, now = new Date()): OfferSnapshot {
  const { price, listPrice } = priceOf(doc, now);
  return {
    id: Number(doc['id']),
    title: str(doc['title']),
    price,
    listPrice,
    stock: typeof doc['stock'] === 'number' ? doc['stock'] : null,
    howToBuy: howToBuy(doc['howToBuy']),
    deposit: micros(doc['depositMicros']),
  };
}

export function cardFromDoc(doc: Record<string, unknown>, now = new Date()): OfferCard {
  const { price, listPrice } = priceOf(doc, now);
  return {
    id: Number(doc['id']),
    title: str(doc['title']),
    price,
    listPrice,
    stock: typeof doc['stock'] === 'number' ? doc['stock'] : null,
    summary: typeof doc['summary'] === 'string' ? doc['summary'] : null,
    image: doc['image'] ?? null,
    howToBuy: howToBuy(doc['howToBuy']),
    deposit: micros(doc['depositMicros']),
    slug: typeof doc['slug'] === 'string' && doc['slug'] ? doc['slug'] : null,
    section: sectionOf(doc['section'])?.slug ?? null,
    specs: publicSpecs(
      cleanCharacteristics(sectionOf(doc['section'])?.characteristics),
      specsOf(doc['specs']),
    ),
  };
}

/** Раздел из связи: при глубине 1 - запись, при 0 - только номер (тогда слага нет). */
const sectionOf = (v: unknown): { slug: string; title: string; characteristics: unknown } | null =>
  v && typeof v === 'object' && typeof (v as Record<string, unknown>)['slug'] === 'string'
    ? (v as { slug: string; title: string; characteristics: unknown })
    : null;

/** Значения характеристик: только простые значения, остальное отбрасывается. */
function specsOf(v: unknown): Record<string, SpecValue> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  return Object.fromEntries(
    Object.entries(v as Record<string, unknown>).filter(
      ([, x]) => typeof x === 'string' || typeof x === 'number' || typeof x === 'boolean',
    ),
  ) as Record<string, SpecValue>;
}

export function detailFromDoc(doc: Record<string, unknown>): OfferDetailCard {
  const section = sectionOf(doc['section']);
  return {
    ...cardFromDoc(doc),
    gallery: Array.isArray(doc['gallery'])
      ? doc['gallery'].filter((m) => m && typeof m === 'object')
      : [],
    description: doc['description'] ?? null,
    sectionTitle: section?.title ?? null,
    characteristics: cleanCharacteristics(section?.characteristics),
  };
}

const lineFromDoc = (l: Record<string, unknown>): InvoiceLine => ({
  offer: idOf(l['offer']),
  title: str(l['title']),
  quantity: Number(l['quantity']),
  price: Number(l['priceMicros']),
  sum: Number(l['sumMicros']),
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
          removed: str(l['removedReason']) || null,
          listPrice: micros(l['listPriceMicros']),
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
    cancelReason: str(doc['cancelReason']) || null,
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
    extra: ((doc['extraLines'] ?? []) as Record<string, unknown>[]).map(extraFromDoc),
    total: Number(doc['totalMicros']),
    dueAt: typeof doc['dueAt'] === 'string' ? doc['dueAt'] : null,
    voidReason: str(doc['voidReason']) || null,
  };
}

const extraKind = (v: unknown): ExtraKind =>
  EXTRA_KINDS.includes(v as ExtraKind) ? (v as ExtraKind) : 'charge';

/**
 * Добавленная строка счёта из документа.
 *
 * @remarks
 * Денежные поля в базе не бывают отрицательными (ADR-002), поэтому скидка лежит своим
 * размером, а вычетом становится здесь, по виду строки.
 */
const extraFromDoc = (l: Record<string, unknown>): ExtraLine => ({
  kind: extraKind(l['kind']),
  title: str(l['title']),
  offer: idOf(l['offer']),
  quantity: Number(l['quantity'] ?? 1),
  price: Number(l['priceMicros']),
  appliesTo: idOf(l['appliesTo']),
  sum: extraKind(l['kind']) === 'discount' ? -Number(l['sumMicros']) : Number(l['sumMicros']),
});

export const extraToDoc = (l: ExtraLine) => ({
  kind: l.kind,
  title: l.title,
  offer: l.offer,
  quantity: l.quantity,
  priceMicros: l.price,
  appliesTo: l.appliesTo,
  sumMicros: Math.abs(l.sum),
});

export const lineToDoc = (l: InvoiceLine | OrderLine) => ({
  offer: l.offer,
  title: l.title,
  quantity: l.quantity,
  priceMicros: l.price,
  sumMicros: l.sum,
  ...('mode' in l
    ? {
        mode: l.mode,
        depositMicros: l.deposit,
        removedReason: l.removed ?? null,
        listPriceMicros: l.listPrice ?? null,
      }
    : {}),
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
        client: {
          execute(q: { sql: string; args: (number | string)[] }): Promise<{ rowsAffected: number }>;
        };
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

/** Порты на Payload. */
export function payloadPorts(payload: Payload, req?: PayloadRequest): ShopPorts {
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
        const where = ids
          ? { id: { in: ids } }
          : 'section' in query
            ? { 'section.slug': { equals: query.section } }
            : null;
        const found = await payload.find({
          collection: 'offers',
          ...(where ? { where } : {}),
          limit: ids
            ? ids.length
            : 'section' in query
              ? SECTION_CAP
              : Math.min(Math.max(1, 'limit' in query ? query.limit : 1), 100),
          sort: 'title',
          pagination: false,
          ...opts,
          depth: 1,
        });
        return found.docs.map((d) => cardFromDoc(d as unknown as Record<string, unknown>));
      },
      detail: async (slug) => {
        const found = await payload.find({
          collection: 'offers',
          where: { slug: { equals: slug } },
          limit: 1,
          pagination: false,
          ...opts,
          depth: 1,
        });
        const doc = found.docs[0];
        return doc ? detailFromDoc(doc as unknown as Record<string, unknown>) : null;
      },
      section: async (slug) => {
        const found = await payload.find({
          collection: 'catalog-sections',
          where: { slug: { equals: slug } },
          limit: 1,
          pagination: false,
          ...opts,
        });
        const doc = found.docs[0] as unknown as Record<string, unknown> | undefined;
        return doc
          ? {
              slug: str(doc['slug']),
              title: str(doc['title']),
              description: typeof doc['description'] === 'string' ? doc['description'] : null,
              characteristics: cleanCharacteristics(doc['characteristics']),
            }
          : null;
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
      switchStatus: async (id, from, to, cancelReason) => {
        const at = new Date().toISOString();
        // Причина пишется тем же условным UPDATE, что и статус: отменённый
        // заказ без причины не появляется ни на миг.
        const changed =
          cancelReason === undefined
            ? await execute(payload)(
                'UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status = ?',
                [to, at, Number(id), from],
              )
            : await execute(payload)(
                'UPDATE orders SET status = ?, cancel_reason = ?, updated_at = ? WHERE id = ? AND status = ?',
                [to, cancelReason, at, Number(id), from],
              );
        return changed === 1;
      },
      removeLine: async (id, index, status, reason, total) => {
        const at = new Date().toISOString();
        // Строка помечается, только пока заказ в том же состоянии и она не снята:
        // второе снятие не вернёт остаток ещё раз. _order у строк массива - с единицы.
        const marked = await execute(payload)(
          `UPDATE orders_lines SET removed_reason = ?
             WHERE _parent_id = ? AND _order = ? AND removed_reason IS NULL
               AND EXISTS (SELECT 1 FROM orders WHERE id = ? AND status = ?)`,
          [reason, Number(id), index + 1, Number(id), status],
        );
        if (marked !== 1) return false;
        await execute(payload)('UPDATE orders SET total_micros = ?, updated_at = ? WHERE id = ?', [
          total,
          at,
          Number(id),
        ]);
        return true;
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
          data: {
            ...withTotal(i),
            lines: i.lines.map(lineToDoc),
            extraLines: i.extra.map(extraToDoc),
          } as never,
          ...opts,
        });
        return invoiceFromDoc(doc as unknown as Record<string, unknown>);
      },
      update: async (id, patch) => {
        const data: Record<string, unknown> = { ...withTotal(patch) };
        if (patch.lines) data['lines'] = patch.lines.map(lineToDoc);
        if (patch.extra) data['extraLines'] = patch.extra.map(extraToDoc);
        await payload.update({ collection: 'invoices', id, data: data as never, ...opts });
      },
      remove: async (id) => {
        await payload.delete({ collection: 'invoices', id, ...opts });
      },
    },
    money: moneyPort(),
    settings: async () => {
      const doc = await payload.findGlobal({ slug: 'site-settings', ...opts });
      return shopSettings((doc as unknown as { shop?: Record<string, unknown> | null }).shop);
    },
    now: () => new Date(),
    transaction: (work) => {
      // Внутри открытой транзакции вложенный сценарий идёт в ней же: второй
      // заход в замок ждал бы сам себя.
      if (req) return work(ports);
      return serial(async () => {
        const txReq = await createLocalReq({}, payload);
        const own = await initTransaction(txReq);
        try {
          const result = await work(payloadPorts(payload, txReq));
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
