'use client';

import { Button, useConfig, useDocumentInfo } from '@payloadcms/ui';
import { formatAdminURL } from 'payload/shared';
import { useEffect, useState } from 'react';

import { formatMoney, type Money, toMoney, unitsToMicros } from 'contracts';

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
  deposit: 'Счёт на бронь',
  issue: 'Выставить',
  confirm: 'Оплата получена',
  reject: 'Денег нет',
  void: 'Аннулировать',
  refund: 'Вернуть деньги',
  delete: 'Удалить черновик',
};

/** Необратимые действия - красной кнопкой, чтобы их не нажимали походя. */
const DANGER = new Set(['cancel', 'void', 'delete', 'reject']);

const ERRORS: Record<string, string> = {
  money_held: 'По заказу получены деньги: сначала верните их счётом-возвратом.',
  quantity_locked: 'Количество позиции берётся из заказа.',
  forbidden: 'Сейчас это действие недоступно - обновите страницу.',
  reason_required: 'Напишите причину - покупатель увидит её на странице заказа.',
  shortage: 'Не хватило остатка: позицию уже купили по другому заказу.',
  last_line: 'Это последняя строка заказа - отмените заказ целиком.',
  invoice_exists: 'По заказу есть счёт: сначала аннулируйте его или удалите черновик.',
};

const REASON_PROMPT =
  'Причина для покупателя - он увидит её на странице заказа. Для себя пишите в заметку менеджера.';

/**
 * Что спросить у менеджера перед действием.
 *
 * @returns тело запроса; `null` - менеджер передумал; строка - ошибка ввода.
 */
function askBody(
  action: string,
  refundable: Money | undefined,
): Record<string, unknown> | null | string {
  if (action === 'delete' && !window.confirm(`${LABELS[action]}? Отменить это нельзя.`))
    return null;
  if (action === 'cancel' || action === 'void') {
    const reason = window.prompt(REASON_PROMPT, '');
    if (reason === null) return null;
    return reason.trim() ? { reason: reason.trim() } : ERRORS['reason_required']!;
  }
  if (action === 'refund') {
    if (!refundable) return null;
    const raw = window.prompt(
      `Сколько вернуть? Пусто - всё, что осталось: ${formatMoney(refundable)}.`,
      '',
    );
    if (raw === null) return null;
    if (!raw.trim()) return {};
    const units = Number(raw.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(units) || units <= 0) return 'Сумма - число больше нуля.';
    return { amount: toMoney(unitsToMicros(units), refundable.currency) };
  }
  return {};
}

interface State {
  actions: string[];
  canInvoice?: boolean;
  canDeposit?: boolean;
  canDelete?: boolean;
  canRefund?: boolean;
  /** Сколько ещё можно вернуть по счёту. */
  refundable?: Money;
  /** Строки заказа, которые можно снять сейчас. */
  removable?: { index: number; title: string }[];
}

export function ShopActionsField() {
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Пути через formatAdminURL: под путём сайта (/shop/admin) голый /api ушёл бы мимо CMS.
  const base = formatAdminURL({
    apiRoute: config.routes.api,
    path: `/shop/admin/${collectionSlug}/${id}`,
  });
  // Переход через window.location идёт мимо Next, поэтому путь сайта добавляем сами.
  const adminURL = (path: `/${string}`) =>
    formatAdminURL({ adminRoute: config.routes.admin, path, includeBasePath: true });

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
    ...(state.canDeposit ? ['deposit'] : []),
    ...(state.canInvoice ? ['invoice'] : []),
    ...(state.canRefund ? ['refund'] : []),
    ...(state.canDelete ? ['delete'] : []),
  ];
  const removable = state.removable ?? [];
  if (buttons.length === 0 && removable.length === 0) return null;

  const send = async (action: string, body: Record<string, unknown>) => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`${base}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await r.json().catch(() => ({}))) as {
        error?: string;
        id?: string | number;
        order?: string | number | null;
      };
      if (!r.ok)
        return setError(
          ERRORS[data.error ?? ''] ?? 'Не получилось. Обновите страницу и попробуйте снова.',
        );
      // Новый счёт или возврат открываем сразу: дальше менеджер правит черновик.
      if (data.id !== undefined)
        window.location.assign(adminURL(`/collections/invoices/${data.id}`));
      // Удалённый черновик открыть нельзя - возвращаемся к его заказу.
      else if (action === 'delete')
        window.location.assign(
          adminURL(data.order ? `/collections/orders/${data.order}` : '/collections/invoices'),
        );
      else window.location.reload();
    } finally {
      setBusy(false);
    }
  };

  const run = (action: string) => {
    const body = askBody(action, state.refundable);
    if (typeof body === 'string') return setError(body);
    if (body) void send(action, body);
  };

  const removeLine = (line: number, title: string) => {
    const reason = window.prompt(`Снять «${title}»? ${REASON_PROMPT}`, 'Нет в наличии');
    if (reason === null) return;
    if (!reason.trim()) return setError(ERRORS['reason_required']!);
    void send('remove-line', { line, reason: reason.trim() });
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
      {buttons.map((action) => (
        <Button
          key={action}
          buttonStyle={
            DANGER.has(action) ? 'error' : action === buttons[0] ? 'primary' : 'secondary'
          }
          size="small"
          margin={false}
          disabled={busy}
          onClick={() => run(action)}
        >
          {LABELS[action] ?? action}
        </Button>
      ))}
      {removable.length > 0 && (
        <div style={{ flexBasis: '100%', display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 13, opacity: 0.8 }}>
            Снять строку - остаток вернётся, покупатель увидит причину:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {removable.map((l) => (
              <Button
                key={l.index}
                buttonStyle="secondary"
                size="small"
                margin={false}
                disabled={busy}
                onClick={() => removeLine(l.index, l.title)}
              >
                {`Снять: ${l.title}`}
              </Button>
            ))}
          </div>
        </div>
      )}
      {error && (
        <p style={{ flexBasis: '100%', margin: 0, color: 'var(--theme-error-500)' }}>{error}</p>
      )}
    </div>
  );
}
