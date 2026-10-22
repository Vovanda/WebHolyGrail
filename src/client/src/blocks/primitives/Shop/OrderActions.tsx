'use client';

import { useState } from 'react';

import { primaryButton, secondaryButton } from './ui';

/**
 * Действия покупателя на странице заказа: отменить новый заказ, «я оплатил».
 *
 * @remarks
 * Секрет заказа уходит заголовком через прокси сайта. Можно ли действие,
 * решает сервер по таблице переходов; кнопка показывается по состоянию, а
 * отказ сервера выводится словами.
 */
export function OrderActions({
  token,
  action,
  invoiceId,
}: {
  readonly token: string;
  readonly action: 'cancel' | 'report';
  readonly invoiceId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (action === 'cancel' && !window.confirm('Отменить заказ?')) return;
    setBusy(true);
    setError(null);
    try {
      const url =
        action === 'cancel'
          ? '/internal/shop/orders/cancel'
          : `/internal/shop/invoices/${invoiceId}/report`;
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Order-Secret': token },
        body: '{}',
      });
      if (r.ok) return window.location.reload();
      setError('Сейчас это недоступно. Обновите страницу.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className={action === 'report' ? primaryButton : secondaryButton}
      >
        {action === 'report' ? 'Я оплатил' : 'Отменить заказ'}
      </button>
      {error && (
        <span role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </span>
      )}
    </span>
  );
}
