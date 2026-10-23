'use client';

import { useEffect, useId, useRef } from 'react';

import { primaryButton, secondaryButton } from './ui';

/**
 * ConfirmDialog — окно подтверждения действия, которое нельзя откатить.
 *
 * @remarks
 * Client-компонент по необходимости (R14): окно открывается в ответ на клик.
 *
 * Стоит на нативном `<dialog>` и `showModal()`: фон становится инертным,
 * фокус остаётся в окне, Esc закрывает его - браузер делает это сам, своего
 * перехвата клавиш и ловушки фокуса компоненту не нужно. Вид окна тот же,
 * что у карточки посреди экрана (`DetailDrawer`, `placement="center"`).
 *
 * Открыто ли окно, решает тот, кто его ставит: компонент только показывает
 * и сообщает выбор через `onConfirm` и `onCancel`. Тексты приходят снаружи.
 *
 * Лежит в магазине, потому что подтверждение пока нужно только ему (R9):
 * кнопки берёт из `./ui` магазина, общего кубика кнопок в шаблоне ещё нет.
 */
export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly text?: string;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  /** Действие выполняется: кнопки неактивны, окно не закрыть. */
  readonly busy?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const textId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      data-part="confirm"
      aria-labelledby={titleId}
      aria-describedby={text ? textId : undefined}
      // Esc и закрытие браузером приходят событием cancel: окно закрывает
      // тот, кто его открыл, иначе состояние снаружи разойдётся с видом.
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      // Окно может закрыть и сам браузер в обход cancel: тогда состояние
      // снаружи сводится здесь, иначе следующий клик окно не откроет.
      onClose={() => {
        if (open) onCancel();
      }}
      onClick={(event) => {
        // Клик мимо панели попадает в сам dialog - это клик по фону.
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
      className="w-[min(92vw,440px)] rounded-2xl border border-border bg-bg p-0 text-ink shadow-[var(--shadow-overlay)]"
    >
      <div data-part="panel" className="grid gap-4 p-6">
        <h2 id={titleId} data-part="title" className="text-lg font-semibold">
          {title}
        </h2>
        {text && (
          <p id={textId} data-part="text" className="text-muted">
            {text}
          </p>
        )}
        <div data-part="actions" className="flex flex-wrap justify-end gap-3">
          <button type="button" disabled={busy} onClick={onCancel} className={secondaryButton}>
            {cancelLabel}
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className={primaryButton}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
