import type { Endpoint, PayloadRequest } from 'payload';

import {
  canInvoice,
  canOrder,
  cleanCart,
  depositLines,
  isSlug,
  LINE_REMOVE_FROM,
  liveLines,
  MAX_CART_LINES,
  parseMoney,
  INVOICE_TRANSITIONS,
  ORDER_TRANSITIONS,
  refundable,
} from 'contracts';
import type { InvoiceAction, OrderAction } from 'contracts';

import { isEditor } from '../lib/access/editors';
import { checkRequestOrigin } from '../lib/video/request-origin';
import {
  changeInvoice,
  createInvoice,
  createRefund,
  declineBySecret,
  deleteDraft,
  reportBySecret,
} from '../lib/shop/invoices';
import { cancelBySecret, changeOrder, placeOrder, removeLine } from '../lib/shop/orders';
import { payloadPorts } from '../lib/shop/payload-store';
import type { Failure, OfferQuery, Outcome, ShopPorts } from '../lib/shop/ports';
import { myOrders } from '../lib/shop/my-orders';
import { relatedOffers } from '../lib/shop/related';
import { hashOrderSecret, isOrderSecret, newOrderSecret } from '../lib/shop/order-link';
import { take, type RuleName } from '../lib/shop/throttle';
import { toBuyerView, toOfferDetailView, toOfferView } from '../lib/shop/view';
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
  reason_required: 400,
  empty: 400,
  shortage: 409,
  money_held: 409,
  quantity_locked: 400,
  discount_too_large: 400,
  last_line: 409,
  invoice_exists: 409,
  deposit_extra: 400,
};

const ports = (req: PayloadRequest): ShopPorts => payloadPorts(req.payload);

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

/**
 * `?ids=3,7` - позиции корзины; `?q=<запрос>` - поиск для корзины;
 * `?section=<слаг>` - раздел каталога целиком; иначе
 * `?limit=` первых по названию, для витрины.
 */
function offerQuery(req: PayloadRequest): OfferQuery {
  const url = new URL(req.url ?? 'http://local/');
  const ids = url.searchParams.get('ids');
  if (ids !== null) {
    return {
      ids: ids
        .split(',')
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
        .slice(0, MAX_CART_LINES),
    };
  }
  const raw = Math.floor(Number(url.searchParams.get('limit') ?? 60));
  const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 100) : 60;
  const section = url.searchParams.get('section');
  const search = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
  if (search) return { search };
  return isSlug(section) ? { section } : { limit };
}

/**
 * Страница позиции `/shop/item/<слаг>` и раздел каталога `/shop/<слаг>`.
 *
 * @remarks
 * Как и витрина, отдают цену в `Money` и без счёта частоты: их запрашивает
 * сервер сайта. Чужой слаг - 404 без обращения к базе.
 */
const offerDetailEndpoint: Endpoint = {
  path: '/shop/offers/item/:slug',
  method: 'get',
  handler: async (req) => {
    const refused = guard(req, null);
    if (refused) return refused;
    const slug = String(req.routeParams?.['slug'] ?? '');
    if (!isSlug(slug)) return json({ error: 'not_found' }, 404);
    const p = ports(req);
    const card = await p.offers.detail(slug);
    if (!card) return json({ error: 'not_found' }, 404);
    return json(toOfferDetailView(card, p.money, new Date(), await relatedOffers(p, card)));
  },
};

const sectionEndpoint: Endpoint = {
  path: '/shop/sections/:slug',
  method: 'get',
  handler: async (req) => {
    const refused = guard(req, null);
    if (refused) return refused;
    const slug = String(req.routeParams?.['slug'] ?? '');
    if (!isSlug(slug)) return json({ error: 'not_found' }, 404);
    const section = await ports(req).offers.section(slug);
    return section ? json(section) : json({ error: 'not_found' }, 404);
  },
};

/**
 * Позиции для витрины и корзины - цены в `Money`.
 *
 * @remarks
 * Своя ручка вместо REST коллекции: в базе цена - микроединицы учёта, наружу
 * она выходит только в валюте магазина. Частоту не считаем: витрину запрашивает
 * сервер сайта за всех посетителей сразу, и лимит запер бы страницу.
 */
const offersEndpoint: Endpoint = {
  path: '/shop/offers',
  method: 'get',
  handler: async (req) => {
    const refused = guard(req, null);
    if (refused) return refused;
    const p = ports(req);
    const now = new Date();
    const cards = await p.offers.cards(offerQuery(req));
    return json({ docs: cards.map((c) => toOfferView(c, p.money, now)) });
  },
};

/**
 * Дата документа для перевода сумм заказа - момент его оформления (ADR-007).
 *
 * @remarks
 * Покупатель видел суммы по курсу этой даты; возврат по сегодняшнему курсу
 * разошёлся бы с тем, что он платил.
 */
async function documentDate(p: ShopPorts, order: string | number | null): Promise<Date> {
  const found = order === null ? null : await p.orders.get(order);
  return found ? new Date(found.createdAt) : new Date();
}

const placeOrderEndpoint: Endpoint = {
  path: '/shop/orders',
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'placeOrder');
    if (refused) return refused;
    const data = await body(req);
    const secret = newOrderSecret();
    const p = ports(req);
    const result = await placeOrder(p, {
      cart: cleanCart(Array.isArray(data['cart']) ? data['cart'] : []),
      buyer: (data['buyer'] ?? {}) as Record<string, unknown>,
      secretHash: secret.hash,
    });
    return answer(result, (order) => ({
      order: toBuyerView(order, [], new Date(), p.money),
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
    return json(toBuyerView(order, await p.invoices.forOrder(order.id), new Date(), p.money));
  },
};

/**
 * Страница «Моих заказов» одним запросом (`myOrders`).
 *
 * @remarks
 * Лимит частоты считается один раз на запрос, а не на заказ: иначе список из
 * двадцати заказов отнимал бы у покупателя «Я оплатил» и отмену.
 */
const buyerViewsEndpoint: Endpoint = {
  path: '/shop/orders/views',
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'buyerAction');
    if (refused) return refused;
    const raw = (await body(req))['secrets'];
    return json({ views: await myOrders(ports(req), Array.isArray(raw) ? raw : []) });
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

/** Действие покупателя со счётом своего заказа: «я оплатил» или отказ. */
const buyerInvoiceEndpoint = (
  action: 'report' | 'decline',
  run: typeof reportBySecret,
): Endpoint => ({
  path: `/shop/invoices/:id/${action}`,
  method: 'post',
  handler: async (req) => {
    const refused = guard(req, 'buyerAction');
    if (refused) return refused;
    const hash = secretOf(req);
    const id = req.routeParams?.['id'];
    if (!hash || typeof id !== 'string' || !/^\d+$/.test(id))
      return json({ error: 'not_found' }, 404);
    return answer(await run(ports(req), hash, id), (i) => ({ status: i.status }));
  },
});

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
      const live = (await p.invoices.forOrder(order.id)).filter(
        (i) => i.kind === 'invoice' && i.status !== 'voided',
      );
      const hasInvoice = live.length > 0;
      return json({
        status: order.status,
        actions,
        // Строку снимают, пока счёта нет: живой счёт уже несёт её сумму.
        removable:
          LINE_REMOVE_FROM.includes(order.status) &&
          !hasInvoice &&
          liveLines(order.lines).length > 1
            ? order.lines.flatMap((l, index) => (l.removed ? [] : [{ index, title: l.title }]))
            : [],
        // Второй живой основной счёт сценарий отклонит (И-5) - кнопку не показываем.
        canInvoice: order.status === 'accepted' && !live.some((i) => i.purpose === 'payment'),
        canDeposit:
          order.status === 'accepted' &&
          depositLines(liveLines(order.lines)).length > 0 &&
          !live.some((i) => i.purpose === 'deposit'),
      });
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
        canDelete: invoice.status === 'draft',
        canRefund,
        refundable: p.money.at(Math.max(left, 0), await documentDate(p, invoice.order)),
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
    if (kind === 'orders' && action === 'deposit') {
      return answer(await createInvoice(p, id, { purpose: 'deposit' }), (i) => ({ id: i.id }));
    }
    if (kind === 'orders' && action === 'invoice') {
      return answer(await createInvoice(p, id), (i) => ({ id: i.id }));
    }
    if (kind === 'orders' && action === 'remove-line') {
      const data = await body(req);
      const line = Number(data['line']);
      const reason = typeof data['reason'] === 'string' ? data['reason'] : '';
      if (!Number.isInteger(line) || line < 0) return json({ error: 'invalid' }, 400);
      return answer(await removeLine(p, id, line, reason), (o) => ({ total: o.total }));
    }
    if (kind === 'orders' && Object.hasOwn(ORDER_TRANSITIONS, action)) {
      const reason = (await body(req))['reason'];
      return answer(
        await changeOrder(
          p,
          id,
          action as OrderAction,
          'manager',
          typeof reason === 'string' ? reason : undefined,
        ),
        (o) => ({ status: o.status }),
      );
    }
    if (kind === 'invoices' && action === 'delete') {
      const invoice = await p.invoices.get(id);
      return answer(await deleteDraft(p, id), () => ({ order: invoice?.order ?? null }));
    }
    if (kind === 'invoices' && action === 'refund') {
      const data = await body(req);
      let amount: number | undefined;
      if (data['amount'] !== undefined) {
        const parsed = parseMoney(data['amount']);
        if (!parsed.ok) return json({ error: 'invalid', detail: parsed.error }, 400);
        const source = await p.invoices.get(id);
        const back = p.money.back(parsed.money, await documentDate(p, source?.order ?? null));
        if (back === null) return json({ error: 'invalid', detail: 'currency' }, 400);
        amount = back;
      }
      return answer(await createRefund(p, id, { amount }), (i) => ({ id: i.id }));
    }
    if (kind === 'invoices' && Object.hasOwn(INVOICE_TRANSITIONS, action)) {
      const reason = action === 'void' ? (await body(req))['reason'] : undefined;
      return answer(
        await changeInvoice(
          p,
          id,
          action as InvoiceAction,
          'manager',
          typeof reason === 'string' ? reason : undefined,
        ),
        (i) => ({ status: i.status }),
      );
    }
    return json({ error: 'not_found' }, 404);
  },
};

export const shopEndpoints: Endpoint[] = [
  offersEndpoint,
  buyerViewsEndpoint,
  offerDetailEndpoint,
  sectionEndpoint,
  placeOrderEndpoint,
  orderViewEndpoint,
  buyerCancelEndpoint,
  buyerInvoiceEndpoint('report', reportBySecret),
  buyerInvoiceEndpoint('decline', declineBySecret),
  adminActionsEndpoint,
  adminActionEndpoint,
];
