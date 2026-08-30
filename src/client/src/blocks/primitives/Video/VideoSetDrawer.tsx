'use client';

import type { VideoSetItem } from 'contracts';

import { SidePanel } from '@/blocks/primitives/SidePanel';
import { cn } from '@/lib/utils';

import { VideoSetColumn } from './VideoSetColumn';

/**
 * Плейлист боковой панелью.
 *
 * @remarks
 * На телефоне список рядом с плеером не помещается, а лентой под ним видно
 * два видео из двадцати. Поэтому здесь кнопка, а список выезжает панелью.
 *
 * Панель сдвигающая, а не поверх страницы: список серии — часть той же
 * работы, что и просмотр, и накрывать им плеер значит прерывать её. Overlay
 * оставлен навигации, где действие как раз прерывающее.
 *
 * Панель справа - там её ищут по привычке, и туда же тянется большой палец.
 */
export interface VideoSetDrawerProps {
  readonly items: ReadonlyArray<VideoSetItem>;
  readonly channel: string | null;
  readonly setCode: string | null;
  readonly currentCode?: string | null;
  readonly title?: string | undefined;
  /** Выбор видео в панели: без него список уводит на отдельную страницу. */
  readonly onSelect?: ((item: VideoSetItem) => void) | undefined;
  readonly className?: string;
}

export function VideoSetDrawer({
  items,
  channel,
  setCode,
  currentCode = null,
  title,
  onSelect,
  className,
}: VideoSetDrawerProps) {
  if (items.length === 0) return null;

  const position = items.findIndex((item) => item.code === currentCode);

  return (
    <SidePanel
      side="right"
      width="min(25rem, 88vw)"
      title="Плейлист"
      trigger={({ open, isOpen }) => (
        <button
          type="button"
          onClick={open}
          data-part="action"
          className={cn(
            'flex items-center gap-2 rounded-lg border bg-paper px-3 py-2',
            'text-body font-medium text-ink transition-colors',
            isOpen ? 'border-accent' : 'border-border hover:border-border-strong',
            className,
          )}
        >
          <ListIcon />
          Плейлист
          <span className="text-muted">
            {position >= 0 ? `${position + 1} из ${items.length}` : `${items.length}`}
          </span>
        </button>
      )}
    >
      {/*
        Имя плейлиста держится на виду, пока листают список: по нему видно, что
        именно листаешь. Родовое слово с крестиком остаётся сверху и уезжает
        вместе с прокруткой - оно про панель, а не про плейлист.

        Заливка берётся у самой панели: своя делала из имени отдельную плашку,
        хотя это та же поверхность. Без заливки карточки просвечивали бы под
        прилипшим именем.
      */}
      <div className="sticky top-0 z-[1] -mx-4 mb-3 flex flex-col gap-1 border-b border-border bg-[var(--side-panel-bg)] px-4 pb-3 pt-1">
        {title && <p className="text-body font-medium text-ink text-balance">{title}</p>}
        <p className="text-sm text-muted">
          {position >= 0 ? `${position + 1} из ${items.length}` : `${items.length} видео`}
        </p>
      </div>

      <VideoSetColumn
        items={items}
        channel={channel}
        setCode={setCode}
        currentCode={currentCode}
        onSelect={onSelect}
      />
    </SidePanel>
  );
}

function ListIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M4 6h11M4 12h11M4 18h7" />
      <path d="M17 14l4 3-4 3z" />
    </svg>
  );
}
