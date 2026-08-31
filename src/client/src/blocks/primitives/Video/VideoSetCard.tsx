'use client';

import type { VideoSetItem } from 'contracts';

import { cn } from '@/lib/utils';

/**
 * Карточка видео в плейлисте.
 *
 * @remarks
 * Одна карточка знает только про одно видео: обложку, длительность, замок и
 * то, как по ней перейти. Где она стоит - колонкой, лентой или в панели -
 * решает список, поэтому карточку можно поставить и в другой перечень, вроде
 * «в каких ещё плейлистах есть это видео».
 */
export function VideoSetCard({
  item,
  index,
  channel,
  orientation,
  current,
  setCode,
  onSelect,
  unlocking,
}: {
  item: VideoSetItem;
  /**
   * Номер в перечне.
   *
   * @remarks
   * Есть у подборки, где порядок и есть смысл: за первым уроком идёт второй.
   * В витрине канала записи ничем не упорядочены, и номер там сообщал бы
   * порядок, которого нет. Поэтому необязателен.
   */
  index?: number | undefined;
  channel: string | null;
  orientation: 'vertical' | 'horizontal';
  current: boolean;
  setCode: string | null;
  onSelect?: ((item: VideoSetItem) => void) | undefined;
  unlocking: boolean;
}) {
  const playable = !item.locked && item.ready;
  // Плейлист передаётся в адресе: видео может состоять в нескольких, и без этого
  // на его странице пришлось бы выбирать наугад, какой показать под плеером.
  const href = channel
    ? `/@${channel}/v/${item.code}${setCode ? `?set=${encodeURIComponent(setCode)}` : ''}`
    : null;

  const body = (
    <>
      <div
        data-part="card-thumb"
        className={cn(
          'relative shrink-0 overflow-hidden rounded-lg bg-surface',
          // Кадр занимает долю ширины, а не заданное число точек: в узкой
          // колонке - в панели плейлиста - заданная ширина не оставляла месту
          // под название, и оно рвалось на четыре строки. Потолок держит кадр
          // от разрастания там, где колонка широкая.
          orientation === 'horizontal' ? 'w-full' : 'w-2/5 min-w-24 max-w-40',
        )}
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt=""
            loading="lazy"
            className={cn(
              'aspect-video w-full object-cover transition-[filter] duration-700',
              playable || unlocking ? '' : 'brightness-50',
            )}
          />
        ) : (
          <div className="aspect-video w-full" aria-hidden="true" />
        )}

        {!playable && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white',
                unlocking && 'video-lock--opening',
              )}
            >
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
            // Длинное название в ленте занимает четыре строки и тянет карточку
            // вниз; две строки - предел, дальше многоточие.
            orientation === 'horizontal' && 'line-clamp-2',
            current ? 'text-accent' : 'text-ink',
          )}
        >
          {index === undefined ? item.title : `${index}. ${item.title}`}
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
      ? 'flex h-full w-full shrink-0 flex-col gap-2'
      : 'flex items-center gap-3',
    current ? 'border-accent' : 'border-border',
    playable ? 'hover:border-border-strong' : 'opacity-70',
  );

  // Нажатие переключает плеер, если он рядом; иначе это обычная ссылка —
  // так работает и без JS, и при открытии в новой вкладке.
  if (playable && onSelect) {
    return (
      <li data-part="card" className={shell}>
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

  // Закрытый видео — не тупик: нажатие открывает окно ввода кода. Ссылка
  // остаётся настоящей, поэтому без JS и в новой вкладке человек попадает
  // на страницу видео, где написано то же самое.
  if (!playable && item.ready && href) {
    return (
      <li data-part="card" className={shell}>
        {/* В признаке - номер записи: по нему видно не только «открывается
            кодом», но и что именно открывать. */}
        <a
          href={href}
          data-access-code={item.id}
          className="absolute inset-0 z-10"
          aria-label={item.title}
        />
        {body}
      </li>
    );
  }

  return (
    <li data-part="card" className={shell}>
      {playable && href ? (
        <a href={href} className="absolute inset-0 z-10" aria-label={item.title} />
      ) : null}
      {body}
    </li>
  );
}

function lockText(item: VideoSetItem): string {
  if (!item.ready) return 'Готовится к показу';
  return 'Откроется по коду доступа';
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
