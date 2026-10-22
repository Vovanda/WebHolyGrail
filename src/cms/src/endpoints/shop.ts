import type { Endpoint, PayloadRequest } from 'payload';

import {
  canInvoice,
  canOrder,
  cleanCart,
  INVOICE_TRANSITIONS,
  ORDER_TRANSITIONS,
  refundable,
} from 'contracts';
import type { InvoiceAction, OrderAction } from 'contracts';

import { isEditor } from '../lib/access/editors';
import { checkRequestOrigin } from '../lib/video/request-origin';
import { changeInvoice, createInvoice, createRefund, reportBySecret } from '../lib/shop/invoices';
import { cancelBySecret, changeOrder, placeOrder } from '../lib/shop/orders';
import { payloadAccess } from '../lib/shop/payload-access';
import { payloadPorts } from '../lib/shop/payload-store';
import type { Failure, Outcome, ShopPorts } from '../lib/shop/ports';
import { hashOrderSecret, isOrderSecret, newOrderSecret } from '../lib/shop/order-link';
import { take, type RuleName } from '../lib/shop/throttle';
import { toBuyerView } from '../lib/shop/view';
import { allowedOrigins, clientKey, json } from './video/shared';

/**
 * Ручки магазина: переводят HTTP в сценарий и обратно (R11).
 *
 * @remarks
 * Покупательские - открытые: заказ оформляет гость, а свой заказ он узнаёт по
 * секрету в заголовке `X-Order-Secret` (браузер шлёт их через прокси сайта
 * `/internal/shop`). Изменяющие запросы принимают только JSON и только со своего
 * Origin: простой запрос с чужого сайта (`text/plain`) до сценария не доходит.
 * Менеджерские - только редактору (docs/whg/43-shop.md, «Кто что может»).
 */

const BODY_LIMIT = 16 * 1024;

const STATUS: Record<Failure, number> = {
  not_found: 404,
  forbidden: 409,
  invalid: 400,
  empty: 400,
  shortage: 409,
  money_held: 409,
  quantity_locked: 400,
};

const ports = (req: PayloadRequest): ShopPorts =>
  payloadPorts(req.payload, payloadAccess(req.payload));

function answer<T>(result: Outcome<T>, view: (value: T) => unknown): Response {
  if (result.ok) return json(view(result.value));
  return json(
    { error: result.error, ...(result.detail === undefined ? {} : { detail: result.detail }) },
    STATUS[result.error],
  );
}

/** Отказ до сценария: чужой Origin, не JSON, слишком большое тело, частые запросы. */
function guard(req: PayloadRequest, rule: RuleName | null): Response | null {
  if (!checkRequestOrigin(req.headers, allowedOrigins()).allowed)
    return json({ error: 'origin' }, 403);
  if (
    req.method !== 'GET' &&
    !(req.headers.get('content-type') ?? '').startsWith('application/json')
  ) {
    return json({ error: 'content_type' }, 415);
  }
  if (Number(req.headers.get('content-length') ?? 0) > BODY_LIMIT)
    return json({ error: 'too_large' }, 413);
  if (rule) {
    const decision = take(rule, clientKey(req));
    if (!decision.allowed) {
      return new Response(JSON.stringify({ error: 'too_many' }), {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(decision.retryAfterSeconds),
        },
      });
    }
  }
  return null;
}

async function body(req: PayloadRequest): Promise<Record<string, unknown>> {
  const data = await req.json?.().catch(() => null);
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
}

/** Параметры менеджерского пути: вид и номер обязательны, действие - если есть. */
function params(req: PayloadRequest): { kind: string; id: string; action: string } | null {
  const { kind, id, action } = (req.routeParams ?? {}) as Record<string, unknown>;
  if (typeof kind !== 'string' || typeof id !== 'string' || !/^\d+$/.test(id)) return null;
  return { kind, id, action: typeof action === 'string' ? action : '' };
}

const secretOf = (req: PayloadRequest): string | null => {
  const token = req.headers.get('x-order-secret');
  return isOrderSecret(token) ? hashOrderSecret(token) : null;
};

/** Вошедший редактор; в своём обработчике Payload вход не разбирает - спрашиваем сами. */
async function editor(req: PayloadRequest): Promise<boolean> {
  if (isEditor(req.user)) return true;
  const { user } = await req.payload.auth({ headers: req.headers });
  return isEditor(user);
}

const placeOrderEndpoint: Endpoint = {
  path: '/shop/orders',
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'placeOrder');
    if (refused) return refused;
    const data = await body(req);
    const secret = newOrderSecret();
    const result = await placeOrder(ports(req), {
      cart: cleanCart(Array.isArray(data['cart']) ? data['cart'] : []),
      buyer: (data['buyer'] ?? {}) as Record<string, unknown>,
      secretHash: secret.hash,
    });
    return answer(result, (order) => ({
      order: toBuyerView(order, [], new Date()),
      secret: secret.token,
    }));
  },
};

const orderViewEndpoint: Endpoint = {
  path: '/shop/orders/view',
  method: 'get',
  handler: async (req) => {
    const refused = guard(req, 'buyerAction');
    if (refused) return refused;
    const hash = secretOf(req);
    const p = ports(req);
    const order = hash ? await p.orders.bySecretHash(hash) : null;
    if (!order) return json({ error: 'not_found' }, 404);
    return json(toBuyerView(order, await p.invoices.forOrder(order.id), new Date()));
  },
};

const buyerCancelEndpoint: Endpoint = {
  path: '/shop/orders/cancel',
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'buyerAction');
    if (refused) return refused;
    const hash = secretOf(req);
    if (!hash) return json({ error: 'not_found' }, 404);
    return answer(await cancelBySecret(ports(req), hash), (o) => ({ status: o.status }));
  },
};

const buyerReportEndpoint: Endpoint = {
  path: '/shop/invoices/:id/report',
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'buyerAction');
    if (refused) return refused;
    const hash = secretOf(req);
    const id = req.routeParams?.['id'];
    if (!hash || typeof id !== 'string' || !/^\d+$/.test(id))
      return json({ error: 'not_found' }, 404);
    return answer(await reportBySecret(ports(req), hash, id), (i) => ({ status: i.status }));
  },
};

/**
 * Какие действия доступны менеджеру сейчас - для кнопок в админке.
 *
 * @remarks
 * Кнопки берут список отсюда, а список - из той же таблицы, по которой идёт
 * переход. Своей логики «что показывать» у админки нет.
 */
const adminActionsEndpoint: Endpoint = {
  path: '/shop/admin/:kind/:id',
  method: 'get',
  handler: async (req) => {
    if (!(await editor(req))) return json({ error: 'forbidden' }, 403);
    const route = params(req);
    if (!route) return json({ error: 'not_found' }, 404);
    const { kind, id } = route;
    const p = ports(req);
    if (kind === 'orders') {
      const order = await p.orders.get(id);
      if (!order) return json({ error: 'not_found' }, 404);
      const actions = (Object.keys(ORDER_TRANSITIONS) as OrderAction[]).filter((a) =>
        canOrder(order.status, a, 'manager'),
      );
      return json({ status: order.status, actions, canInvoice: order.status === 'accepted' });
    }
    if (kind === 'invoices') {
      const invoice = await p.invoices.get(id);
      if (!invoice) return json({ error: 'not_found' }, 404);
      const actions = (Object.keys(INVOICE_TRANSITIONS) as InvoiceAction[]).filter((a) =>
        canInvoice(invoice.status, a, 'manager', invoice.kind),
      );
      const siblings = invoice.order === null ? [] : await p.invoices.forOrder(invoice.order);
      const left = refundable(
        invoice.total,
        siblings.filter((i) => i.kind === 'refund' && String(i.refundOf) === String(invoice.id)),
      );
      const canRefund = invoice.kind === 'invoice' && invoice.status === 'paid' && left > 0;
      return json({
        status: invoice.status,
        kind: invoice.kind,
        actions,
        canRefund,
        refundable: left,
      });
    }
    return json({ error: 'not_found' }, 404);
  },
};

const adminActionEndpoint: Endpoint = {
  path: '/shop/admin/:kind/:id/:action',
  method: 'post',
  handler: async (req) => {
    if (!(await editor(req))) return json({ error: 'forbidden' }, 403);
    const refused = guard(req, null);
    if (refused) return refused;
    const route = params(req);
    if (!route) return json({ error: 'not_found' }, 404);
    const { kind, id, action } = route;
    const p = ports(req);
    if (kind === 'orders' && action === 'invoice') {
      return answer(await createInvoice(p, id), (i) => ({ id: i.id }));
    }
    if (kind === 'orders' && Object.hasOwn(ORDER_TRANSITIONS, action)) {
      return answer(await changeOrder(p, id, action as OrderAction, 'manager'), (o) => ({
        status: o.status,
      }));
    }
    if (kind === 'invoices' && action === 'refund') {
      const data = await body(req);
      const amount = typeof data['amount'] === 'number' ? data['amount'] : undefined;
      return answer(await createRefund(p, id, { amount }), (i) => ({ id: i.id }));
    }
    if (kind === 'invoices' && Object.hasOwn(INVOICE_TRANSITIONS, action)) {
      return answer(await changeInvoice(p, id, action as InvoiceAction, 'manager'), (i) => ({
        status: i.status,
      }));
    }
    return json({ error: 'not_found' }, 404);
  },
};

export const shopEndpoints: Endpoint[] = [
  placeOrderEndpoint,
  orderViewEndpoint,
  buyerCancelEndpoint,
  buyerReportEndpoint,
  adminActionsEndpoint,
  adminActionEndpoint,
];
