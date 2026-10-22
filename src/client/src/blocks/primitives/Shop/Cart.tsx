'use client';

import type { BlockNode, BuyerErrors, Money, OfferView } from 'contracts';
import { checkBuyer, formatMoney, fromMoney, toMoney } from 'contracts';
import { useEffect, useMemo, useState } from 'react';

import { cart, rememberOrder, useCart } from '@/lib/shop/cart';

import { field, primaryButton } from './ui';

/**
 * Cart - корзина и оформление заказа.
 *
 * @remarks
 * Знает своё: строки корзины, что введено в форму, идёт ли отправка. Названия,
 * цены и остатки берёт с сервера по номерам позиций - сумма здесь только для
 * показа, заказ всё равно считает сервер (И-1). Анкета проверяется той же
 * функцией, что и на сервере (`checkBuyer`), поэтому ошибки встают у полей до
 * отправки. После заказа корзина очищается, браузер запоминает ссылку заказа и
 * открывает его страницу.
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

export function Cart({ node }: { readonly node: BlockNode & { data?: CartData } }) {
  const data = node.data ?? {};
  const lines = useCart();
  const [offers, setOffers] = useState<Map<number, OfferView>>(new Map());
  const [errors, setErrors] = useState<BuyerErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const ids = lines.map((l) => l.offer).join(',');

  useEffect(() => {
    if (!ids) return;
    void fetch(`/internal/shop/offers?ids=${ids}`)
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((d: { docs: OfferView[] }) => setOffers(new Map(d.docs.map((o) => [o.id, o]))))
      .catch(() => undefined);
  }, [ids]);

  const rows = useMemo(
    () =>
      lines
        .map((l) => ({ ...l, offer: offers.get(l.offer) }))
        .filter((r): r is { offer: OfferView & { price: Money }; quantity: number } =>
          Boolean(r.offer?.price),
        ),
    [lines, offers],
  );
  const total = rows.length
    ? toMoney(
        rows.reduce((t, r) => t + fromMoney(r.offer.price) * r.quantity, 0),
        rows[0]!.offer.price.currency,
      )
    : null;

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
    const checked = checkBuyer(raw);
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

  const hint = (k: keyof BuyerErrors) =>
    errors[k] ? (
      <span role="alert" className="text-sm text-[color:var(--color-danger)]">
        {errors[k]}
      </span>
    ) : null;

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h2 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {data.heading ?? 'Корзина'}
        </h2>

        {rows.length === 0 ? (
          <p data-part="empty" className="mt-4 text-muted">
            {lines.length > 0 ? 'Загружаем корзину…' : (data.emptyText ?? 'В корзине пока пусто.')}
          </p>
        ) : (
          <>
            <ul data-part="lines" className="mt-6 divide-y divide-border border-y border-border">
              {rows.map(({ offer, quantity }) => {
                const max = typeof offer.stock === 'number' ? offer.stock : 1000;
                return (
                  <li
                    key={offer.id}
                    data-part="line"
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <span
                      data-part="line-title"
                      className="min-w-0 basis-full text-ink md:basis-0 md:flex-1"
                    >
                      {offer.title}
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Меньше"
                        className="h-8 w-8 rounded-md border border-border text-ink"
                        onClick={() => cart.set(offer.id, quantity - 1)}
                      >
                        −
                      </button>
                      <span
                        data-part="line-quantity"
                        className="w-8 text-center tabular-nums text-ink"
                      >
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Больше"
                        disabled={quantity >= max}
                        className="h-8 w-8 rounded-md border border-border text-ink disabled:opacity-40"
                        onClick={() => cart.set(offer.id, quantity + 1)}
                      >
                        +
                      </button>
                    </span>
                    <span
                      data-part="line-sum"
                      className="ml-auto w-28 text-right tabular-nums text-ink md:ml-0"
                    >
                      {formatMoney(
                        toMoney(fromMoney(offer.price) * quantity, offer.price.currency),
                      )}
                    </span>
                    <button
                      type="button"
                      className="text-sm text-muted hover:text-ink"
                      onClick={() => cart.remove(offer.id)}
                    >
                      Убрать
                    </button>
                  </li>
                );
              })}
            </ul>
            <p data-part="total" className="mt-4 text-right text-lg font-semibold text-ink">
              Итого: {total ? formatMoney(total) : ''}
            </p>

            <form onSubmit={submit} noValidate className="mt-6 grid gap-3 md:max-w-xl">
              <input
                name="name"
                placeholder="Как к вам обращаться"
                className={field}
                autoComplete="name"
              />
              {hint('name')}
              <input
                name="phone"
                placeholder="Телефон"
                className={field}
                autoComplete="tel"
                inputMode="tel"
              />
              {hint('phone')}
              <input
                name="email"
                placeholder="Почта"
                className={field}
                autoComplete="email"
                inputMode="email"
              />
              {hint('email')}
              {hint('contact')}
              <textarea
                name="comment"
                placeholder="Комментарий к заказу"
                rows={3}
                className={field}
              />
              <label className="flex items-start gap-2.5 text-sm text-muted">
                <input
                  type="checkbox"
                  name="consent"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--color-accent)]"
                />
                <span>
                  Согласен на обработку персональных данных{' '}
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
              <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={busy} className={primaryButton}>
                  {busy ? 'Отправляем…' : 'Оформить заказ'}
                </button>
                {message && (
                  <span role="alert" className="text-sm text-[color:var(--color-danger)]">
                    {message}
                  </span>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
