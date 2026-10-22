'use client';

import { useDocumentInfo } from '@payloadcms/ui';
import { useEffect, useState } from 'react';

/**
 * Кнопки переходов заказа и счёта в админке.
 *
 * @remarks
 * Какие кнопки показать, решает сервер по той же таблице, по которой идёт
 * переход (`/api/shop/admin/...`). Своей логики у админки нет: иначе кнопка
 * обещала бы переход, который сценарий отклонит. Статус и строки в форме
 * только читаются - переход идёт здесь (docs/whg/43-shop.md).
 */
const LABELS: Record<string, string> = {
  accept: 'Принять',
  complete: 'Выполнен',
  cancel: 'Отменить заказ',
  invoice: 'Выставить счёт',
  issue: 'Выставить',
  confirm: 'Оплата получена',
  reject: 'Денег нет',
  void: 'Аннулировать',
  refund: 'Вернуть деньги',
};

const ERRORS: Record<string, string> = {
  money_held: 'По заказу получены деньги: сначала верните их счётом-возвратом.',
  quantity_locked: 'Количество позиции берётся из заказа.',
  forbidden: 'Сейчас это действие недоступно - обновите страницу.',
};

interface State {
  actions: string[];
  canInvoice?: boolean;
  canRefund?: boolean;
  /** Сколько ещё можно вернуть по счёту, в копейках. */
  refundable?: number;
}

export function ShopActionsField() {
  const { id, collectionSlug } = useDocumentInfo();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/api/shop/admin/${collectionSlug}/${id}`;

  useEffect(() => {
    if (!id) return;
    void fetch(base, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((s: State | null) => setState(s))
      .catch(() => undefined);
  }, [base, id]);

  if (!id || !state) return null;
  const buttons = [
    ...state.actions,
    ...(state.canInvoice ? ['invoice'] : []),
    ...(state.canRefund ? ['refund'] : []),
  ];
  if (buttons.length === 0) return null;

  const run = async (action: string) => {
    if (action === 'cancel' || action === 'void') {
      if (!window.confirm(`${LABELS[action]}? Отменить это нельзя.`)) return;
    }
    let body: Record<string, unknown> = {};
    if (action === 'refund') {
      const left = ((state.refundable ?? 0) / 100).toLocaleString('ru-RU');
      const raw = window.prompt(`Сколько вернуть, ₽? Пусто - всё, что осталось: ${left} ₽.`, '');
      if (raw === null) return;
      const rub = Number(raw.replace(',', '.'));
      if (raw.trim() && (!Number.isFinite(rub) || rub <= 0))
        return setError('Сумма - число больше нуля.');
      if (raw.trim()) body = { amount: Math.round(rub * 100) };
    }
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${base}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; id?: string | number };
      if (!r.ok)
        return setError(
          ERRORS[data.error ?? ''] ?? 'Не получилось. Обновите страницу и попробуйте снова.',
        );
      // Новый счёт или возврат открываем сразу: дальше менеджер правит черновик.
      if (data.id !== undefined) window.location.assign(`/admin/collections/invoices/${data.id}`);
      else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {buttons.map((action) => (
        <button key={action} type="button" disabled={busy} onClick={() => void run(action)}>
          {LABELS[action] ?? action}
        </button>
      ))}
      {error && (
        <p style={{ flexBasis: '100%', margin: 0, color: 'var(--theme-error-500)' }}>{error}</p>
      )}
    </div>
  );
}
