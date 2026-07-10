import type { BlogTag } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * TagChip — chip с опциональным цветом из BlogTag.color (token name / hex).
 * Если color пуст или unknown — fallback на bg-surface.
 */
export interface TagChipProps {
  readonly tag: BlogTag;
  readonly className?: string;
}

const TOKEN_COLORS: Readonly<Record<string, string>> = {
  accent: 'bg-accent-soft text-ink',
  success: 'bg-success-soft text-ink',
  danger: 'bg-danger-soft text-ink',
  vk: 'bg-vk-soft text-ink',
};

export function TagChip({ tag, className }: TagChipProps) {
  const colorClass =
    tag.color && TOKEN_COLORS[tag.color] ? TOKEN_COLORS[tag.color] : 'bg-surface text-ink';
  // Custom hex color (если не token-name) — inline style как escape hatch.
  const inlineStyle =
    tag.color && /^#[0-9a-f]{3,8}$/i.test(tag.color) ? { backgroundColor: tag.color } : undefined;
  return (
    <a
      href={`/blog/tag/${tag.slug}`}
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
        'border border-border transition-colors hover:bg-surface-hover',
        !inlineStyle && colorClass,
        className,
      )}
      style={inlineStyle}
    >
      {tag.label}
    </a>
  );
}

/**
 * TagList — горизонтальный flex chips.
 */
export interface TagListProps {
  readonly tags: ReadonlyArray<BlogTag>;
  readonly className?: string;
}

export function TagList({ tags, className }: TagListProps) {
  if (tags.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {tags.map((t) => (
        <TagChip key={t.id} tag={t} />
      ))}
    </div>
  );
}
