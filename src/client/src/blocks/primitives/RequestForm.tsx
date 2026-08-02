'use client';

import { useEffect, useState } from 'react';

import type { BlockNode, SiteSettings } from 'contracts';

/**
 * RequestForm — форма заявки: имя, город, способ связи, сообщение.
 *
 * @remarks
 * Client-компонент по необходимости (R14): форма живёт состоянием — открыта или
 * свёрнута, отправляется, отправлена.
 *
 * Заявка уходит в CMS по `NEXT_PUBLIC_CMS_URL`. В проде это тот же домен, что и
 * сайт: nginx отдаёт `/api` в CMS, так что запрос остаётся same-origin и не
 * упирается в CORS.
 *
 * Одно поле на любой контакт: человек пишет телефон или почту, как ему удобнее.
 * Разделять их — значит заставлять выбирать и терять тех, кто закроет форму.
 */
export interface RequestFormData {
  readonly heading?: string;
  readonly description?: string;
  readonly requestType?: string;
  readonly collapsible?: boolean;
  readonly toggleLabel?: string;
  readonly submitLabel?: string;
  readonly successText?: string;
  readonly askCity?: boolean;
  readonly messageLabel?: string;
  /** Якорь секции: по нему на форму ссылаются кнопки со страницы. */
  readonly anchor?: string;
  /** Кому адресована заявка — id специалиста или раскрытый документ. */
  readonly specialist?: { readonly id?: string | number } | string | number | null;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function RequestForm({
  node,
}: {
  readonly node: BlockNode & { data?: RequestFormData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const collapsible = data.collapsible ?? false;
  const anchorId = data.anchor || `form-${data.requestType ?? 'general'}`;
  const [open, setOpen] = useState(!collapsible);
  const [status, setStatus] = useState<Status>('idle');

  // Кнопка «Записаться» со страницы ведёт на #anchor. Если форма свёрнута, то
  // без этого человек попадает на заголовок и пустое место: полей на странице
  // просто нет. Раскрываем, когда пришли именно за этой формой — по ссылке с
  // той же страницы (hashchange) или по прямой ссылке из мессенджера.
  useEffect(() => {
    if (!collapsible) return;
    const openIfTargeted = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) !== anchorId) return;
      setOpen(true);
      // Браузер уже проскроллил к свёрнутой секции; после раскрытия она стала
      // выше — возвращаем её в кадр целиком.
      requestAnimationFrame(() => {
        document.getElementById(anchorId)?.scrollIntoView({ block: 'start' });
      });
    };
    openIfTargeted();
    window.addEventListener('hashchange', openIfTargeted);
    return () => window.removeEventListener('hashchange', openIfTargeted);
  }, [collapsible, anchorId]);
  const specialistId =
    typeof data.specialist === 'object' && data.specialist
      ? String(data.specialist.id ?? '')
      : data.specialist
        ? String(data.specialist)
        : '';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setStatus('sending');
    try {
      const cmsUrl = process.env['NEXT_PUBLIC_CMS_URL'] ?? '';
      const res = await fetch(`${cmsUrl}/api/form-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: data.requestType ?? 'general',
          source: typeof window === 'undefined' ? '' : window.location.pathname,
          // specialistId кладём внутрь data: по нему CMS засчитывает заявку
          // конкретному специалисту.
          data: { ...values, ...(specialistId ? { specialistId } : {}) },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  const field =
    'w-full rounded-md border border-border bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent';

  return (
    <section id={anchorId} className="bg-bg py-10 md:py-14 scroll-mt-24">
      <div className="mx-auto max-w-content px-4 md:px-6">
        <h2 className="font-display text-2xl font-semibold text-ink md:text-3xl">{data.heading}</h2>
        {data.description && <p className="mt-2 text-muted">{data.description}</p>}

        {collapsible && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-accent px-5 py-3 font-medium text-accent transition-colors hover:bg-accent hover:text-accent-fg"
            aria-expanded={false}
          >
            {data.toggleLabel ?? 'Оставить заявку'}
            <span aria-hidden="true">＋</span>
          </button>
        )}

        {open && (
          <form onSubmit={submit} className="mt-5 grid gap-3 md:max-w-xl">
            <input name="name" required placeholder="Как к вам обращаться" className={field} />
            {(data.askCity ?? true) && <input name="city" placeholder="Город" className={field} />}
            <input
              name="contact"
              required
              placeholder="Телефон или почта"
              className={field}
              aria-describedby="contact-hint"
            />
            <p id="contact-hint" className="-mt-1 text-sm text-muted">
              Как вам удобнее — позвоним или напишем.
            </p>
            <textarea
              name="message"
              rows={4}
              placeholder={data.messageLabel ?? 'Сообщение'}
              className={field}
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={status === 'sending'}
                className="rounded-md bg-accent px-6 py-3 font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === 'sending' ? 'Отправляем…' : (data.submitLabel ?? 'Отправить')}
              </button>
              {status === 'sent' && (
                <span role="status" className="text-sm text-ink">
                  {data.successText ?? 'Заявка отправлена.'}
                </span>
              )}
              {status === 'error' && (
                <span role="alert" className="text-sm text-[color:var(--color-danger)]">
                  Не отправилось. Попробуйте ещё раз или напишите нам напрямую.
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
