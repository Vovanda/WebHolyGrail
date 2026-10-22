import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { formatMoney, INVOICE_STATUS_LABELS, ORDER_STATUS_LABELS, shopSettings } from 'contracts';

import { OrderActions } from '@/blocks/primitives/Shop/OrderActions';
import { PaymentDetails } from '@/blocks/primitives/Shop/PaymentDetails';
import { getOrderView, getSiteSettings } from '@/lib/api-client.engine';

/**
 * Страница заказа по секретной ссылке: состав, состояние, счета, коды доступа.
 *
 * @remarks
 * Ссылка - единственный ключ покупателя без входа, поэтому страница не
 * индексируется и не отдаёт адрес дальше: `no-referrer`, иначе секрет ушёл бы
 * в журнал первого же сайта, куда покупатель перейдёт отсюда.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Заказ',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order, settings] = await Promise.all([getOrderView(token), getSiteSettings()]);
  if (!order) notFound();
  const invoices = order.invoices.filter((i) => i.kind === 'invoice' && i.status !== 'voided');
  const refunds = order.invoices.filter((i) => i.kind === 'refund' && i.status === 'paid');

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h1 data-part="title" className="font-display text-2xl font-semibold text-ink md:text-3xl">
          Заказ № {order.id}
        </h1>
        <p data-part="status" className="mt-2 text-muted">
          {ORDER_STATUS_LABELS[order.status]} ·{' '}
          {new Date(order.createdAt).toLocaleDateString('ru-RU')}
        </p>
        <p className="mt-2 text-sm text-muted">
          Сохраните эту страницу: по её адресу заказ открывается без входа.
        </p>

        <ul data-part="lines" className="mt-6 divide-y divide-border border-y border-border">
          {order.lines.map((l, i) => (
            <li
              key={i}
              data-part="line"
              className="flex flex-wrap justify-between gap-3 py-3 text-ink"
            >
              <span>
                {l.title} × {l.quantity}
                {l.mode === 'request' && order.status === 'new' && (
                  <span data-part="line-note" className="block text-sm text-muted">
                    По заявке: продавец подтвердит наличие
                  </span>
                )}
              </span>
              <span className="tabular-nums">{formatMoney(l.sum)}</span>
            </li>
          ))}
        </ul>
        <p data-part="total" className="mt-4 text-right text-lg font-semibold text-ink">
          Итого: {formatMoney(order.total)}
        </p>

        {order.status === 'new' && (
          <div className="mt-6">
            <p className="mb-3 text-muted">
              Менеджер свяжется с вами, посчитает доставку и выставит счёт.
            </p>
            <OrderActions token={token} action="cancel" />
          </div>
        )}

        {invoices.map((inv) => (
          <article
            key={inv.id}
            data-part="invoice"
            className="mt-8 rounded-xl border border-border bg-surface p-4 md:p-6"
          >
            <header className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-ink">
                {inv.purpose === 'deposit' ? 'Счёт на бронь' : 'Счёт'} № {inv.id}
              </h2>
              <span
                data-part="invoice-status"
                className={inv.overdue ? 'text-[color:var(--color-danger)]' : 'text-muted'}
              >
                {inv.overdue ? 'Срок оплаты прошёл' : INVOICE_STATUS_LABELS[inv.status]}
                {inv.dueAt && inv.status === 'issued'
                  ? ` · до ${new Date(inv.dueAt).toLocaleDateString('ru-RU')}`
                  : ''}
              </span>
            </header>
            <ul className="mt-3 divide-y divide-border">
              {inv.lines.map((l, i) => (
                <li key={i} className="flex flex-wrap justify-between gap-3 py-2 text-ink">
                  <span>
                    {l.title} × {l.quantity}
                  </span>
                  <span className="tabular-nums">{formatMoney(l.sum)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right font-semibold text-ink">
              К оплате: {formatMoney(inv.total)}
            </p>
            {inv.status === 'issued' && (
              <div className="mt-4 grid gap-3">
                <PaymentDetails shop={shopSettings(settings?.shop)} note={settings?.paymentNote} />
                <div>
                  <OrderActions token={token} action="report" invoiceId={inv.id} />
                </div>
              </div>
            )}
            {inv.codes.length > 0 && (
              <div data-part="codes" className="mt-4">
                <p className="text-sm text-muted">
                  Коды доступа к видео - введите на странице видео:
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {inv.codes.map((c) => (
                    <li
                      key={c}
                      className="rounded-md border border-accent px-3 py-1.5 font-mono text-ink"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}

        {refunds.map((r) => (
          <p key={r.id} data-part="refund" className="mt-6 text-muted">
            Возвращено {formatMoney(r.total)}.
          </p>
        ))}
      </div>
    </section>
  );
}
