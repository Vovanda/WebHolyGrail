import { cn } from '@/lib/utils';

/**
 * SectionEyebrow — подпись секции: мелкий капс с разрядкой и hairline под ним.
 *
 * @remarks
 * Служебная метка («Избранное», «Последние»), а не заголовок страницы: она
 * называет поток записей под собой и отделяет его от предыдущего. Поэтому по
 * умолчанию рендерится как `h2` — уровень задаётся через `as`, когда секция
 * вложена глубже.
 *
 * Server component (R14), только токены (R2).
 */
export interface SectionEyebrowProps {
  readonly children: React.ReactNode;
  readonly as?: 'h2' | 'h3' | 'p';
  /** Правый край — счётчик, ссылка «все записи» и подобное. */
  readonly aside?: React.ReactNode;
  readonly className?: string;
}

export function SectionEyebrow({
  children,
  as: Tag = 'h2',
  aside,
  className,
}: SectionEyebrowProps) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 border-b border-border pb-3',
        className,
      )}
    >
      <Tag
        data-part="title"
        className="text-eyebrow font-display font-semibold uppercase tracking-eyebrow text-ink"
      >
        {children}
      </Tag>
      {aside && <div className="text-eyebrow uppercase tracking-eyebrow text-muted">{aside}</div>}
    </div>
  );
}
