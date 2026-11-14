'use client';

import { useState } from 'react';

import { ConfirmDialog } from './ConfirmDialog';
import { primaryButton, secondaryButton } from './ui';

type Action = 'cancel' | 'report' | 'decline';

/** Что делает кнопка: куда идёт запрос, как подписана и что спросить перед ним. */
const ACTIONS: Readonly<
  Record<
    Action,
    {
      readonly url: (invoiceId?: string) => string;
      readonly label: string;
      readonly primary: boolean;
      readonly confirm?: {
        readonly title: string;
        readonly text: string;
        readonly yes: string;
        readonly no: string;
      };
    }
  >
> = {
  cancel: {
    url: () => '/internal/shop/orders/cancel',
    label: 'Отменить заказ',
    primary: false,
    confirm: {
      title: 'Отменить заказ?',
      text: 'Позиции вернутся на витрину. Отмену не вернуть - понадобится новый заказ.',
      yes: 'Отменить заказ',
      no: 'Не отменять',
    },
  },
  report: {
    url: (id) => `/internal/shop/invoices/${id}/report`,
    label: 'Я оплатил',
    primary: true,
  },
  decline: {
    url: (id) => `/internal/shop/invoices/${id}/decline`,
    label: 'Отказаться от счёта',
    primary: false,
    confirm: {
      title: 'Отказаться от счёта?',
      text: 'Счёт будет аннулирован, продавец увидит отказ. Заказ при этом не отменяется.',
      yes: 'Отказаться',
      no: 'Оставить счёт',
    },
  },
};

/** Отказ сервера словами: что случилось и что делать. */
const ERRORS: Readonly<Record<string, string>> = {
  money_held: 'По заказу уже есть оплата или вы сообщили о ней - отмените через продавца.',
};

/**
 * Действия покупателя на странице заказа: отменить заказ, «я оплатил», отказаться
 * от счёта.
 *
 * @remarks
 * Секрет заказа уходит заголовком через прокси сайта. Можно ли действие,
 * решает сервер по таблице переходов; кнопка показывается по состоянию, а
 * отказ сервера выводится словами. Необратимое спрашивает модалкой шаблона.
 */
export function OrderActions({
  token,
  action,
  invoiceId,
}: {
  readonly token: string;
  readonly action: Action;
  readonly invoiceId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const spec = ACTIONS[action];

  const fail = (code?: string) => {
    setAsking(false);
    setBusy(false);
    setError(ERRORS[code ?? ''] ?? 'Сейчас это недоступно. Обновите страницу.');
  };

  // busy снимается только при неудаче: при успехе страница перезагружается,
  // и до перезагрузки кнопки должны оставаться неактивными.
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(spec.url(invoiceId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Order-Secret': token },
        body: '{}',
      });
      if (r.ok) return window.location.reload();
      fail(((await r.json().catch(() => ({}))) as { error?: string }).error);
    } catch {
      fail();
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => (spec.confirm ? setAsking(true) : void run())}
        className={spec.primary ? primaryButton : secondaryButton}
      >
        {spec.label}
      </button>
      {error && (
        <span role="alert" className="text-sm text-[color:var(--color-danger)]">
          {error}
        </span>
      )}
      {spec.confirm && (
        <ConfirmDialog
          open={asking}
          busy={busy}
          title={spec.confirm.title}
          text={spec.confirm.text}
          confirmLabel={spec.confirm.yes}
          cancelLabel={spec.confirm.no}
          onConfirm={() => void run()}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  );
}
