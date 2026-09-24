/**
 * Прокрутка панели предпросмотра вслед за формой.
 *
 * @remarks
 * Страница в панели открыта с адреса сайта, а форма - с адреса CMS, и прокрутить
 * чужую рамку напрямую браузер не даёт. Поэтому админка шлёт в рамку долю
 * прокрутки формы сообщением, а страница прокручивает себя на ту же долю.
 * Доля, а не точки: форма и страница разной длины, и совпадать должны места,
 * а не расстояния от верха.
 */

/** Метка сообщения: по ней страница отличает его от чужих. */
export const PREVIEW_SCROLL_MESSAGE = 'whg-preview-scroll';

export interface PreviewScrollMessage {
  readonly type: typeof PREVIEW_SCROLL_MESSAGE;
  /** Доля прокрутки от 0 (начало) до 1 (конец). */
  readonly ratio: number;
}

const clamp = (value: number): number => Math.min(1, Math.max(0, value));

/** Доля прокрутки; то, что не прокручивается вовсе, стоит в начале. */
export function scrollRatio(top: number, scrollHeight: number, viewHeight: number): number {
  const room = scrollHeight - viewHeight;
  return room > 0 ? clamp(top / room) : 0;
}

/** Отступ сверху, при котором страница стоит на той же доле. */
export function scrollTopFor(ratio: number, scrollHeight: number, viewHeight: number): number {
  return Math.round(clamp(ratio) * Math.max(0, scrollHeight - viewHeight));
}

export function previewScrollMessage(ratio: number): PreviewScrollMessage {
  return { type: PREVIEW_SCROLL_MESSAGE, ratio: clamp(ratio) };
}

/** Доля из пришедшего сообщения; чужое и испорченное - `null`. */
export function readPreviewScroll(data: unknown): number | null {
  if (typeof data !== 'object' || data === null) return null;
  const message = data as { type?: unknown; ratio?: unknown };
  if (message.type !== PREVIEW_SCROLL_MESSAGE) return null;
  return typeof message.ratio === 'number' && Number.isFinite(message.ratio)
    ? clamp(message.ratio)
    : null;
}
