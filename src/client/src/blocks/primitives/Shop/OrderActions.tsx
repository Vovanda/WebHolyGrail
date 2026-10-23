'use client';

import { useState } from 'react';

import { ConfirmDialog } from './ConfirmDialog';
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
  const [asking, setAsking] = useState(false);

  const fail = () => {
    setAsking(false);
    setBusy(false);
    setError('Сейчас это недоступно. Обновите страницу.');
  };

  // busy снимается только при неудаче: при успехе страница перезагружается,
  // и до перезагрузки кнопки должны оставаться неактивными.
  const run = async () => {
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
      fail();
    } catch {
      fail();
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => (action === 'cancel' ? setAsking(true) : void run())}
        className={action === 'report' ? primaryButton : secondaryButton}
      >
        {action === 'report' ? 'Я оплатил' : 'Отменить заказ'}
      </button>
      {error && (
        <span role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </span>
      )}
      {action === 'cancel' && (
        <ConfirmDialog
          open={asking}
          busy={busy}
          title="Отменить заказ?"
          text="Позиции вернутся на витрину. Отмену не вернуть - понадобится новый заказ."
          confirmLabel="Отменить заказ"
          cancelLabel="Не отменять"
          onConfirm={() => void run()}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}
