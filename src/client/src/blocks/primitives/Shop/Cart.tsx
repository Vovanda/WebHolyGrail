'use client';

import type {
  AskField,
  BlockNode,
  BuyerErrors,
  CheckoutRules,
  MediaRef,
  Money,
  OfferView,
} from 'contracts';
import {
  checkBuyer,
  DEFAULT_CHECKOUT,
  formatMoney,
  fromMoney,
  PHONE_FORMATS,
  toMoney,
} from 'contracts';
import { useEffect, useMemo, useState } from 'react';

import { MediaImage } from '@/blocks/primitives/Media';
import { cart, rememberedOrders, rememberOrder, useCart } from '@/lib/shop/cart';

import { field, primaryButton } from './ui';

/**
 * Cart - корзина и оформление заказа.
 *
 * @remarks
 * Части: строки корзины, итог с анкетой и кнопкой, ссылки на свои заказы у пустой
 * корзины. Знает своё: строки, что введено в форму, идёт ли отправка. Названия,
 * цены и остатки берёт с сервера по номерам позиций - сумма здесь только для
 * показа, заказ всё равно считает сервер (И-1). Позиция, которой больше нет в
 * продаже, убирается из корзины с пояснением, иначе корзина висела бы на загрузке.
 *
 * Анкета проверяется той же функцией и по тем же правилам владельца, что на
 * сервере (`checkBuyer`, «Что спрашивать при оформлении» в настройках), поэтому
 * ошибки встают у полей до отправки. После заказа корзина очищается, браузер
 * запоминает ссылку заказа и открывает его страницу.
 *
 * На широком экране итог стоит отдельной колонкой и не уезжает при прокрутке
 * длинного списка; на узком всё идёт одной колонкой.
 */
export interface CartData {
  readonly heading?: string;
  readonly emptyText?: string;
  readonly policyHref?: string;
}

const MESSAGES: Record<string, string> = {
  shortage:
    'Часть позиций закончилась, пока вы выбирали. Количество поправлено - проверьте корзину.',
  empty: 'В корзине нет позиций, которые можно заказать.',
  too_many: 'Слишком много заказов с вашего адреса. Попробуйте через час.',
};

type Row = { offer: OfferView & { price: Money }; quantity: number };

const stepper =
  'flex h-11 w-11 items-center justify-center rounded-md border border-border text-lg text-ink transition-colors hover:bg-surface-hover disabled:opacity-40';

const words = (n: number) =>
  n % 10 === 1 && n % 100 !== 11
    ? 'позиция'
    : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)
      ? 'позиции'
      : 'позиций';

export function Cart({
  node,
  checkout: rules = DEFAULT_CHECKOUT,
}: {
  readonly node: BlockNode & { data?: CartData };
  /** Что спрашивать при оформлении - из настроек магазина. */
  readonly checkout?: CheckoutRules;
}) {
  const data = node.data ?? {};
  const lines = useCart();
  const [offers, setOffers] = useState<Map<number, OfferView>>(new Map());
  const [loaded, setLoaded] = useState('');
  const [dropped, setDropped] = useState(false);
  const [orders, setOrders] = useState<string[]>([]);
  const [errors, setErrors] = useState<BuyerErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = lines.map((l) => l.offer).join(',');

  useEffect(() => setOrders(rememberedOrders()), []);

  useEffect(() => {
    if (!ids) return;
    void fetch(`/internal/shop/offers?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs: OfferView[] }) => {
        const found = new Map(d.docs.map((o) => [o.id, o]));
        setOffers(found);
        setLoaded(ids);
        // Позиции больше нет или у неё нет цены - в заказ она не пойдёт: убираем сразу.
        const dead = ids
          .split(',')
          .map(Number)
          .filter((id) => !found.get(id)?.price);
        if (dead.length > 0) {
          dead.forEach((id) => cart.remove(id));
          setDropped(true);
        }
      })
      .catch(() => setLoaded(ids));
  }, [ids]);

  const rows = useMemo(
    () =>
      lines
        .map((l) => ({ ...l, offer: offers.get(l.offer) }))
        .filter((r): r is Row => Boolean(r.offer?.price)),
    [lines, offers],
  );
  const count = rows.reduce((n, r) => n + r.quantity, 0);
  // За пределом точных целых сумму не показываем: сервер такой заказ всё равно не примет.
  const lineSum = (r: Row) => {
    const micros = fromMoney(r.offer.price) * r.quantity;
    return Number.isSafeInteger(micros) ? toMoney(micros, r.offer.price.currency) : null;
  };
  const totalMicros = rows.reduce((t, r) => t + fromMoney(r.offer.price) * r.quantity, 0);
  const total =
    rows.length && Number.isSafeInteger(totalMicros)
      ? toMoney(totalMicros, rows[0]!.offer.price.currency)
      : null;
  const loading = lines.length > 0 && loaded !== ids;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const raw = {
      name: form.get('name'),
      phone: form.get('phone'),
      email: form.get('email'),
      comment: form.get('comment'),
      consent: form.get('consent') === 'on',
    };
    const checked = checkBuyer(raw, rules);
    if (!checked.ok) return setErrors(checked.errors);
    setErrors({});
    setMessage(null);
    setBusy(true);
    try {
      const r = await fetch('/internal/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: lines, buyer: raw }),
      });
      const res = (await r.json().catch(() => ({}))) as {
        secret?: string;
        error?: string;
        detail?: unknown;
      };
      if (r.ok && res.secret) {
        cart.clear();
        rememberOrder(res.secret);
        window.location.assign(`/order/${res.secret}`);
        return;
      }
      if (res.error === 'invalid' && res.detail) return setErrors(res.detail as BuyerErrors);
      if (res.error === 'shortage' && Array.isArray(res.detail)) {
        for (const s of res.detail as { offer: number; available: number }[])
          cart.set(s.offer, s.available);
      }
      setMessage(MESSAGES[res.error ?? ''] ?? 'Не получилось отправить. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  // Поле проверяется, как только из него ушли: о неверном номере покупатель
  // узнаёт сразу, а не после «Оформить». Ошибки других полей не трогаем.
  const checkField = (event: React.FocusEvent<HTMLFormElement>) => {
    const name = (event.target as unknown as HTMLInputElement).name as keyof BuyerErrors;
    if (!['name', 'phone', 'email'].includes(name)) return;
    const form = new FormData(event.currentTarget);
    const checked = checkBuyer(
      {
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        consent: true,
      },
      rules,
    );
    // Пустое необязательное поле ошибки не даёт - её снимает и стирание номера;
    // заполненный телефон или почта снимают и общее «телефон или почта».
    // Пустое поле, которое проскочили, новой ошибки не даёт - только снимает старую.
    const errors = checked.ok ? {} : checked.errors;
    const filled = String(form.get(name) ?? '').trim() !== '';
    setErrors((current) => ({
      ...current,
      [name]: filled ? errors[name] : current[name] && errors[name],
      ...(name === 'name' ? {} : { contact: current.contact && errors.contact }),
    }));
  };

  const hint = (k: keyof BuyerErrors) =>
    errors[k] ? (
      <span role="alert" className="text-sm text-danger">
        {errors[k]}
      </span>
    ) : null;
  const label = (text: string, ask: AskField) => (ask === 'required' ? `${text} *` : text);

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <h2 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {data.heading ?? 'Корзина'}
          {count > 0 && (
            <span className="ml-3 align-middle text-base font-normal text-muted">
              {count} {words(count)}
            </span>
          )}
        </h2>

        {dropped && (
          <p data-part="notice" role="status" className="mt-4 text-sm text-muted">
            Часть позиций больше не продаётся - мы убрали их из корзины.
          </p>
        )}

        {rows.length === 0 ? (
          <div data-part="empty" className="mt-6 max-w-content">
            <p className="text-muted">
              {loading ? 'Загружаем корзину…' : (data.emptyText ?? 'В корзине пока пусто.')}
            </p>
            {!loading && orders.length > 0 && (
              <div data-part="orders" className="mt-6">
                <p className="text-sm font-medium text-ink">Ваши заказы</p>
                <ul className="mt-2 grid gap-1 text-sm">
                  {orders.slice(0, 5).map((token, i) => (
                    <li key={token}>
                      <a
                        href={`/order/${token}`}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        {i === 0 ? 'Последний заказ' : 'Более ранний заказ'}
                      </a>
                    </li>
                  ))}
                </ul>
                <a
                  href="/orders"
                  className="mt-2 inline-block text-sm text-accent underline-offset-2 hover:underline"
                >
                  Все мои заказы
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <ul data-part="lines" className="divide-y divide-border border-y border-border">
              {rows.map(({ offer, quantity }) => {
                const sum = lineSum({ offer, quantity });
                const max = typeof offer.stock === 'number' ? offer.stock : 1000;
                const image =
                  typeof offer.image === 'object' && offer.image ? (offer.image as MediaRef) : null;
                return (
                  <li
                    key={offer.id}
                    data-part="line"
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 py-5 sm:grid-cols-[auto_minmax(0,1fr)_auto_9rem]"
                  >
                    <div
                      data-part="line-media"
                      className="row-span-2 h-16 w-16 overflow-hidden rounded-md border border-border bg-surface sm:row-span-1"
                    >
                      {image && (
                        <MediaImage
                          media={image}
                          place="64px"
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 self-center">
                      <p data-part="line-title" className="font-medium text-ink">
                        {offer.title}
                      </p>
                      <p className="mt-0.5 text-sm tabular-nums text-muted">
                        {formatMoney(offer.price)} за шт.
                      </p>
                      {offer.howToBuy === 'request' && (
                        <p data-part="line-note" className="mt-0.5 text-sm text-muted">
                          По заявке: наличие подтвердит продавец
                        </p>
                      )}
                    </div>
                    <div className="col-start-2 flex items-center gap-2 sm:col-start-auto">
                      <button
                        type="button"
                        aria-label={`Меньше: ${offer.title}`}
                        className={stepper}
                        onClick={() => cart.set(offer.id, quantity - 1)}
                      >
                        −
                      </button>
                      <span
                        data-part="line-quantity"
                        aria-live="polite"
                        className="w-8 text-center tabular-nums text-ink"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Больше: ${offer.title}`}
                        disabled={quantity >= max}
                        className={stepper}
                        onClick={() => cart.set(offer.id, quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        data-part="line-remove"
                        className="ml-2 min-h-11 px-2 text-sm text-muted transition-colors hover:text-ink sm:hidden"
                        onClick={() => cart.remove(offer.id)}
                      >
                        Убрать
                      </button>
                    </div>
                    <div className="col-start-2 flex items-center justify-between gap-3 sm:col-start-auto sm:flex-col sm:items-end sm:justify-center">
                      <span
                        data-part="line-sum"
                        className="font-display text-lg font-semibold tabular-nums text-ink"
                      >
                        {sum ? formatMoney(sum) : ''}
                      </span>
                      <button
                        type="button"
                        data-part="line-remove"
                        className="hidden text-sm text-muted transition-colors hover:text-ink sm:block"
                        onClick={() => cart.remove(offer.id)}
                      >
                        Убрать
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <aside
              data-part="summary"
              className="rounded-xl border border-border bg-surface p-5 md:p-6 lg:sticky lg:top-24"
            >
              <p data-part="total" className="flex items-baseline justify-between gap-4">
                <span className="text-muted">Итого</span>
                <span className="font-display text-2xl font-semibold tracking-tight tabular-nums text-ink">
                  {total ? formatMoney(total) : ''}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Оплата - по счёту: продавец выставит его, когда подтвердит заказ.
              </p>

              <form onSubmit={submit} onBlur={checkField} noValidate className="mt-6 grid gap-3">
                <input
                  name="name"
                  placeholder="Как к вам обращаться *"
                  aria-label="Как к вам обращаться"
                  className={field}
                  autoComplete="name"
                />
                {hint('name')}
                {rules.phone === 'optional' && rules.email === 'optional' && (
                  <p data-part="contact-hint" className="text-sm text-muted">
                    Оставьте телефон или почту - иначе продавец не сможет с вами связаться.
                  </p>
                )}
                {rules.phone !== 'hidden' && (
                  <input
                    name="phone"
                    placeholder={`${label('Телефон', rules.phone)}, например ${PHONE_FORMATS[rules.phoneFormat].example}`}
                    aria-label="Телефон"
                    className={field}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                )}
                {hint('phone')}
                {rules.email !== 'hidden' && (
                  <input
                    name="email"
                    placeholder={label('Почта', rules.email)}
                    aria-label="Почта"
                    className={field}
                    autoComplete="email"
                    inputMode="email"
                  />
                )}
                {hint('email')}
                {hint('contact')}
                {rules.comment && (
                  <textarea
                    name="comment"
                    placeholder="Комментарий к заказу"
                    aria-label="Комментарий к заказу"
                    rows={3}
                    className={field}
                  />
                )}
                <label className="flex items-start gap-2.5 text-sm text-muted">
                  <input
                    type="checkbox"
                    name="consent"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-accent)]"
                  />
                  <span>
                    Согласен на обработку персональных данных.{' '}
                    <a
                      href={data.policyHref ?? '/privacy'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Политика обработки данных
                    </a>
                  </span>
                </label>
                {hint('consent')}
                <button
                  type="submit"
                  disabled={busy}
                  className={`${primaryButton} min-h-12 w-full`}
                >
                  {busy ? 'Отправляем…' : 'Оформить заказ'}
                </button>
                {message && (
                  <p role="alert" className="text-sm text-danger">
                    {message}
                  </p>
                )}
              </form>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
