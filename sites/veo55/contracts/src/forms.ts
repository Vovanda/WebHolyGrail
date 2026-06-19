/**
 * Заявка с формы. Источник правды — Payload-коллекция `FormSubmissions`.
 *
 * @remarks
 * Универсальная форма заявок. `formType` различает источник (callback / question /
 * booking / etc.) — конкретные значения задаются по мере появления форм на сайте.
 * `payload` — произвольный JSON с полями формы, валидация и схема — на стороне
 * конкретной формы в client (Zod-схема в `client/blocks/.../Form/schema.ts`).
 */
export interface FormSubmission {
  readonly id: string;
  /** Discriminator формы: `callback`, `question`, `litter-inquiry`, ... */
  readonly formType: string;
  /** Сырые данные формы. Структура зависит от `formType`. */
  readonly payload: Readonly<Record<string, unknown>>;
  /** Статус обработки. */
  readonly status: FormSubmissionStatus;
  /** ISO дата создания. */
  readonly createdAt: string;
  /** Откуда пришло (URL страницы, UTM, реферер). Свободная форма. */
  readonly source?: string;
}

export type FormSubmissionStatus = 'new' | 'in_progress' | 'done' | 'spam';

/**
 * DTO для отправки заявки с фронта. `client` отправляет это в CMS-endpoint,
 * CMS валидирует и сохраняет как {@link FormSubmission}.
 */
export interface FormSubmissionInput {
  readonly formType: string;
  readonly payload: Readonly<Record<string, unknown>>;
  readonly source?: string;
}
