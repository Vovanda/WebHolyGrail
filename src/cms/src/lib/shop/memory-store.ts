import { type OfferSnapshot, type OrderStatus, type ShopSettings, shopSettings } from 'contracts';

import { moneyPort } from './money';
import type { Id, ShopPorts, StoredInvoice, StoredOrder } from './ports';

/**
 * Порты магазина в памяти - для тестов сценариев без базы.
 *
 * @remarks
 * Транзакция настоящая в той мере, что нужна тестам: состояние копируется до
 * работы и восстанавливается, если сценарий вернул отказ или бросил ошибку.
 * Так тест видит, что отказ ничего не оставил.
 */
export interface MemoryState {
  offers: Map<number, OfferSnapshot>;
  orders: Map<string, StoredOrder>;
  invoices: Map<string, StoredInvoice>;
  seq: number;
  now: Date;
  settings: ShopSettings;
}

export function memoryState(offers: OfferSnapshot[] = []): MemoryState {
  return {
    offers: new Map(offers.map((o) => [o.id, o])),
    orders: new Map(),
    invoices: new Map(),
    seq: 0,
    now: new Date('2026-10-23T12:00:00Z'),
    settings: shopSettings(null),
  };
}

const clone = (s: MemoryState): MemoryState => ({
  ...s,
  offers: new Map(s.offers),
  orders: new Map(s.orders),
  invoices: new Map(s.invoices),
});

export function memoryPorts(state: MemoryState): ShopPorts {
  const next = (): string => String((state.seq += 1));
  const ports: ShopPorts = {
    offers: {
      snapshots: async (ids) =>
        ids.map((id) => state.offers.get(id)).filter((o): o is OfferSnapshot => !!o),
      cards: async (query) => {
        const all = [...state.offers.values()].sort((a, b) => a.title.localeCompare(b.title));
        // Разделов каталога в памяти нет: выборка по разделу пуста.
        const picked =
          'ids' in query
            ? all.filter((o) => query.ids.includes(o.id))
            : 'section' in query
              ? []
              : all.slice(0, query.limit);
        return picked.map((o) => ({
          id: o.id,
          title: o.title,
          price: o.price,
          listPrice: o.listPrice ?? null,
          stock: o.stock,
          summary: null,
          image: null,
          howToBuy: o.howToBuy,
          deposit: o.deposit,
          slug: null,
          section: null,
          specs: {},
        }));
      },
      detail: async () => null,
      section: async () => null,
      take: async (lines) => {
        const taken: { offer: number; quantity: number }[] = [];
        for (const l of lines) {
          const o = state.offers.get(l.offer);
          if (!o || (o.stock !== null && o.stock < l.quantity)) {
            for (const t of taken) {
              const back = state.offers.get(t.offer)!;
              if (back.stock !== null)
                state.offers.set(t.offer, { ...back, stock: back.stock + t.quantity });
            }
            return { ok: false as const, offer: l.offer };
          }
          if (o.stock !== null) state.offers.set(l.offer, { ...o, stock: o.stock - l.quantity });
          taken.push(l);
        }
        return { ok: true as const };
      },
      giveBack: async (lines) => {
        for (const l of lines) {
          const o = state.offers.get(l.offer);
          if (o && o.stock !== null)
            state.offers.set(l.offer, { ...o, stock: o.stock + l.quantity });
        }
      },
    },
    orders: {
      create: async (o) => {
        const order: StoredOrder = {
          ...o,
          id: next(),
          createdAt: state.now.toISOString(),
          cancelReason: null,
        };
        state.orders.set(String(order.id), order);
        return order;
      },
      get: async (id) => state.orders.get(String(id)) ?? null,
      removeLine: async (id, index, status, reason, total) => {
        const o = state.orders.get(String(id));
        const line = o?.lines[index];
        if (!o || o.status !== status || !line || line.removed) return false;
        const lines = o.lines.map((l, i) => (i === index ? { ...l, removed: reason } : l));
        state.orders.set(String(id), { ...o, lines, total });
        return true;
      },
      bySecretHash: async (hash) =>
        [...state.orders.values()].find((o) => o.secretHash === hash) ?? null,
      switchStatus: async (id: Id, from: OrderStatus, to: OrderStatus, cancelReason?: string) => {
        const o = state.orders.get(String(id));
        if (!o || o.status !== from) return false;
        state.orders.set(String(id), {
          ...o,
          status: to,
          cancelReason: cancelReason ?? o.cancelReason,
        });
        return true;
      },
      newBefore: async (before) =>
        [...state.orders.values()]
          .filter((o) => o.status === 'new' && new Date(o.createdAt) < before)
          .map((o) => o.id),
    },
    invoices: {
      forOrder: async (order) =>
        [...state.invoices.values()].filter((i) => String(i.order) === String(order)),
      get: async (id) => state.invoices.get(String(id)) ?? null,
      create: async (i) => {
        const invoice: StoredInvoice = { ...i, id: next() };
        state.invoices.set(String(invoice.id), invoice);
        return invoice;
      },
      update: async (id, patch) => {
        const i = state.invoices.get(String(id));
        if (i) state.invoices.set(String(id), { ...i, ...patch });
      },
      remove: async (id) => {
        state.invoices.delete(String(id));
      },
    },
    money: moneyPort(),
    settings: async () => state.settings,
    now: () => state.now,
    transaction: async (work) => {
      const saved = clone(state);
      const rollback = (): void => {
        Object.assign(state, saved);
      };
      try {
        const result = await work(ports);
        if (result && typeof result === 'object' && 'ok' in result && result.ok === false)
          rollback();
        return result;
      } catch (error) {
        rollback();
        throw error;
      }
    },
  };
  return ports;
}
