import { cn } from '@/lib/utils';

/**
 * Описание под видео: начало видно, остальное раскрывается.
 *
 * @remarks
 * Длинное описание занимает пол-экрана и отодвигает вниз всё, что под ним,
 * поэтому показывается началом, а остаток открывается нажатием.
 *
 * Работает без JS (R14): `details` умеет это сам. Текст при этом не
 * повторяется - начало живёт в заголовке, продолжение в теле, - иначе
 * поисковик видел бы описание дважды.
 */
export interface VideoDescriptionProps {
  readonly text: string;
  /** Сколько знаков показать до раскрытия. */
  readonly limit?: number;
  readonly className?: string;
}

export function VideoDescription({ text, limit = 240, className }: VideoDescriptionProps) {
  const { head, tail } = splitForPreview(text, limit);
  const body = 'whitespace-pre-line text-body leading-relaxed text-ink/90';

  if (!tail)
    return (
      <p data-part="body" className={cn(body, className)}>
        {text}
      </p>
    );

  return (
    <details data-part="body" className={cn('group', className)}>
      <summary className={cn(body, 'cursor-pointer list-none [&::-webkit-details-marker]:hidden')}>
        {head}
        <span className="group-open:hidden">…</span>
        <span className="ml-1 whitespace-nowrap text-sm font-medium text-muted group-hover:text-ink group-open:hidden">
          ещё
        </span>
      </summary>
      <p className={body}>{tail}</p>
      <span className="mt-1 inline-block cursor-pointer text-sm font-medium text-muted">
        свернуть
      </span>
    </details>
  );
}

/**
 * Делит текст на видимое начало и остаток.
 *
 * @remarks
 * Режем по границе слова: обрыв посреди слова читается как поломка вёрстки.
 * Короткий остаток делить незачем - текст отдаётся целиком.
 */
function splitForPreview(text: string, limit: number): { head: string; tail: string } {
  if (text.length <= limit + 40) return { head: text, tail: '' };

  const space = text.lastIndexOf(' ', limit);
  const cut = space > limit / 2 ? space : limit;
  return { head: text.slice(0, cut), tail: text.slice(cut).trimStart() };
}
