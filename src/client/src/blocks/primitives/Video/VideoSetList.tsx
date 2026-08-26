import type { VideoSetItem } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * Список роликов набора.
 *
 * @remarks
 * Один компонент на три места: справа от плеера, под роликом на его странице
 * и отдельным блоком, где плеера нет вовсе. Отличаются они только тем, как
 * список повёрнут, поэтому разводить три похожих списка незачем (R9).
 *
 * Чистая функция от пропсов (R5): ничего не грузит и не знает, где стоит.
 * Замок и готовность приходят посчитанными — считать их здесь означало бы
 * делать это в браузере, где зрителю верить нельзя.
 */
export interface VideoSetListProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  /** Адрес канала: из него собираются ссылки на ролики. */
  readonly channel: string | null;
  /**
   * Как повёрнут список.
   *
   * @remarks
   * `vertical` — колонкой: рядом с плеером и когда роликов много.
   * `horizontal` — лентой: под плеером, где вертикаль отняла бы всю высоту.
   */
  readonly orientation?: 'vertical' | 'horizontal';
  /** Отмеченный ролик — тот, что играет сейчас. */
  readonly currentCode?: string | null;
  /** Набор, из которого пришли: чтобы на странице ролика показать его же. */
  readonly setCode?: string | null;
  /** Нажатие вместо перехода — когда плеер рядом и уходить со страницы незачем. */
  readonly onSelect?: ((item: VideoSetItem) => void) | undefined;
  readonly className?: string;
}

export function VideoSetList({
  items,
  channel,
  orientation = 'vertical',
  currentCode = null,
  setCode = null,
  onSelect,
  className,
}: VideoSetListProps) {
  if (items.length === 0) {
    return <p className="text-body text-muted">В наборе пока нет роликов.</p>;
  }

  return (
    <ol
      className={cn(
        orientation === 'horizontal'
          ? // Лента с прокруткой: под плеером высота дороже ширины.
            'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]'
          : 'flex flex-col gap-2',
        className,
      )}
    >
      {items.map((item, index) => (
        <VideoSetRow
          key={item.code}
          item={item}
          index={index + 1}
          channel={channel}
          orientation={orientation}
          current={item.code === currentCode}
          setCode={setCode}
          onSelect={onSelect}
        />
      ))}
    </ol>
  );
}

function VideoSetRow({
  item,
  index,
  channel,
  orientation,
  current,
  setCode,
  onSelect,
}: {
  item: VideoSetItem;
  index: number;
  channel: string | null;
  orientation: 'vertical' | 'horizontal';
  current: boolean;
  setCode: string | null;
  onSelect?: ((item: VideoSetItem) => void) | undefined;
}) {
  const playable = !item.locked && item.ready;
  // Набор передаётся в адресе: ролик может состоять в нескольких, и без этого
  // на его странице пришлось бы выбирать наугад, какой показать под плеером.
  const href = channel
    ? `/@${channel}/v/${item.code}${setCode ? `?set=${encodeURIComponent(setCode)}` : ''}`
    : null;

  const body = (
    <>
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-lg bg-surface',
          orientation === 'horizontal' ? 'w-full' : 'w-32 sm:w-40',
        )}
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt=""
            loading="lazy"
            className={cn('aspect-video w-full object-cover', playable ? '' : 'brightness-50')}
          />
        ) : (
          <div className="aspect-video w-full" aria-hidden="true" />
        )}

        {!playable && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white">
              <LockIcon size={16} />
            </span>
          </span>
        )}

        {item.durationSeconds ? (
          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-xs tabular-nums text-white">
            {formatDuration(item.durationSeconds)}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <span
          className={cn(
            'text-body font-medium leading-snug text-balance',
            current ? 'text-accent' : 'text-ink',
          )}
        >
          {index}. {item.title}
        </span>
        {!playable && (
          <span className="flex items-center gap-1.5 text-sm text-muted">
            <LockIcon />
            {lockText(item)}
          </span>
        )}
        {current && <span className="text-sm text-muted">Играет сейчас</span>}
      </div>
    </>
  );

  const shell = cn(
    'group relative rounded-xl border bg-paper p-3 transition-colors',
    orientation === 'horizontal'
      ? 'flex w-56 shrink-0 snap-start flex-col gap-2'
      : 'flex items-center gap-3',
    current ? 'border-accent' : 'border-border',
    playable ? 'hover:border-border-strong' : 'opacity-70',
  );

  // Нажатие переключает плеер, если он рядом; иначе это обычная ссылка —
  // так работает и без JS, и при открытии в новой вкладке.
  if (playable && onSelect) {
    return (
      <li className={shell}>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="absolute inset-0 z-10 cursor-pointer"
          aria-label={item.title}
        />
        {body}
      </li>
    );
  }

  return (
    <li className={shell}>
      {playable && href ? (
        <a href={href} className="absolute inset-0 z-10" aria-label={item.title} />
      ) : null}
      {body}
    </li>
  );
}

function lockText(item: VideoSetItem): string {
  if (!item.ready) return 'Готовится к показу';
  return item.lockReason === 'not-entitled' ? 'Открывается по доступу' : 'Откроется после входа';
}

function LockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** «12:05» — привычный вид длительности. */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
