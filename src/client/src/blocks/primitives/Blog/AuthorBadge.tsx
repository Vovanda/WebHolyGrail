import type { BlogAuthor } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * AuthorBadge — компактная meta-карточка автора (avatar + name + role).
 * Clickable → /blog/author/<slug>.
 */
export interface AuthorBadgeProps {
  readonly author: BlogAuthor;
  readonly className?: string;
  readonly variant?: 'compact' | 'full';
}

export function AuthorBadge({ author, className, variant = 'compact' }: AuthorBadgeProps) {
  const href = `/blog/author/${author.slug}`;

  if (variant === 'full') {
    return (
      <a href={href} className={cn('flex items-center gap-3 group', className)}>
        {author.avatar?.url && (
          <img
            src={author.avatar.url}
            alt={author.avatar.alt ?? author.name}
            className="w-10 h-10 rounded-full object-cover"
            loading="lazy"
          />
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-ink group-hover:underline">{author.name}</span>
          {author.role && <span className="text-xs text-muted">{author.role}</span>}
        </div>
      </a>
    );
  }

  return (
    <a href={href} className={cn('inline-flex items-center gap-1.5 hover:underline', className)}>
      {author.avatar?.url && (
        <img
          src={author.avatar.url}
          alt=""
          className="w-5 h-5 rounded-full object-cover"
          loading="lazy"
        />
      )}
      <span>{author.name}</span>
    </a>
  );
}
