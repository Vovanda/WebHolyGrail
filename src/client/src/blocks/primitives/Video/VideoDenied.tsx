import type { VideoDeniedSettings } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * Заглушка вместо закрытой записи.
 *
 * @remarks
 * Замок сам по себе тупик: человек видит, что нельзя, и не понимает, что
 * делать. Поэтому здесь остаётся обложка, а поверх неё - что происходит и куда
 * идти дальше.
 *
 * Текст и кнопку задаёт владелец в настройках: у одного сайта это код доступа,
 * у другого подписка. Зашивать в код нечего (R0).
 */
export interface VideoDeniedProps {
  /** Почему запись не показывается. */
  readonly reason: 'not-entitled' | 'not-ready';
  readonly settings?: VideoDeniedSettings | undefined;
  readonly poster?: string | undefined;
  readonly className?: string | undefined;
}

/** На случай пустых настроек: сайт не должен показывать пустой прямоугольник. */
const FALLBACK = {
  title: 'Откроется по коду доступа',
  notReady: 'Видео ещё готовится к показу',
} as const;

export function VideoDenied({ reason, settings, poster, className }: VideoDeniedProps) {
  const notReady = reason === 'not-ready';
  const title = notReady
    ? settings?.notReadyTitle?.trim() || FALLBACK.notReady
    : settings?.title?.trim() || FALLBACK.title;

  // Пока запись готовится, идти зрителю некуда: остаётся подождать.
  const actionLabel = notReady ? null : settings?.actionLabel?.trim();
  const actionHref = notReady ? null : settings?.actionHref?.trim();
  const note = notReady ? null : settings?.note?.trim();

  return (
    <div
      className={cn(
        'relative flex aspect-video flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-border bg-surface px-6 text-center',
        className,
      )}
    >
      {poster && (
        <>
          <img
            data-part="media"
            src={poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Затемнение: поверх светлой обложки текст иначе не читается. */}
          <span className="absolute inset-0 bg-ink/55" aria-hidden="true" />
        </>
      )}

      <p
        data-part="title"
        className={cn('relative text-body font-medium', poster ? 'text-paper' : 'text-ink')}
      >
        {title}
      </p>

      {note && (
        <p
          data-part="subtitle"
          className={cn('relative text-sm', poster ? 'text-paper/80' : 'text-muted')}
        >
          {note}
        </p>
      )}

      {actionLabel && actionHref && (
        <a
          href={actionHref}
          data-part="action"
          className="relative rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-fg transition-colors hover:bg-accent-hover"
        >
          {actionLabel}
        </a>
      )}
    </div>
  );
}
