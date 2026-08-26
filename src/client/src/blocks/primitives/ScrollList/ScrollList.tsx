'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Вертикальный список: прокрутка, порции, память места.
 *
 * @remarks
 * Второй контрол в паре с каруселью. Карусель листает кадры вбок и показывает
 * по одному-двум; список стоит колонкой и показывает набор целиком - в панели,
 * рядом с плеером, в каталоге. Задачи разные, поэтому и контрола два.
 *
 * Что список умеет сверх обычной колонки:
 *
 * - **своя прокрутка** с потолком по высоте: без неё длинный набор утаскивает
 *   вниз всю страницу, и до того, что под ним, никто не доходит;
 * - **порции**: показать десять из ста, остальное по кнопке или по мере
 *   прокрутки - сто карточек разом браузер рисует заметно дольше;
 * - **память места**: вернувшись, человек видит список там же, где оставил,
 *   вместе с уже раскрытыми порциями.
 *
 * Память живёт в хранилище браузера у конкретного зрителя и на сервер не
 * уходит: место в списке - его личное удобство.
 */
export interface ScrollListProps {
  readonly children: React.ReactNode;
  /** Сколько показывать сразу. Без значения показываются все. */
  readonly limit?: number | undefined;
  /**
   * Что делать с остатком.
   *
   * @remarks
   * `button` - кнопка «Показать ещё»: человек сам решает, когда список вырастет.
   * `scroll` - следующая порция появляется, когда прокрутка дошла до низа.
   */
  readonly more?: 'button' | 'scroll';
  /** Сколько добавлять за раз. Без значения - столько же, сколько показано сразу. */
  readonly step?: number | undefined;
  /**
   * Потолок высоты: любое значение CSS.
   *
   * @remarks
   * Без него список растёт по содержимому и прокручивается вместе со страницей.
   */
  readonly maxHeight?: string | undefined;
  /**
   * Ключ памяти. С ним список запоминает место прокрутки и раскрытые порции.
   *
   * @remarks
   * У каждого списка на сайте ключ свой: общий склеил бы память каталога и
   * списка серии.
   */
  readonly rememberKey?: string | undefined;
  /**
   * Какой элемент сейчас главный: список подъезжает к нему сам.
   *
   * @remarks
   * Плеер переключил видео - список показывает, где это видео в наборе. Без
   * этого активная карточка остаётся за краем, и человек ищет её руками.
   *
   * Подъезд мягкий и только когда карточка вне видимой части: дёргать список
   * при каждом касании незачем.
   */
  readonly activeIndex?: number | undefined;
  readonly gap?: 'sm' | 'md';
  readonly className?: string | undefined;
  /** Что показать, когда показывать нечего. */
  readonly empty?: React.ReactNode;
  readonly label?: string | undefined;
}

const GAP = { sm: 'gap-2', md: 'gap-3' } as const;

export function ScrollList({
  children,
  limit,
  more = 'button',
  step,
  maxHeight,
  rememberKey,
  activeIndex,
  gap = 'sm',
  className,
  empty,
  label,
}: ScrollListProps) {
  const items = Array.isArray(children) ? children : [children];
  const total = items.length;

  const [shown, setShown] = useState(limit ?? total);
  const boxRef = useRef<HTMLOListElement | null>(null);
  const restored = useRef(false);

  // Память места читается один раз при появлении списка: дальше человек листает
  // сам, и подменять ему позицию посреди чтения нельзя.
  useEffect(() => {
    if (!rememberKey || restored.current) return;
    restored.current = true;
    try {
      const raw = window.localStorage.getItem(`whg:list:${rememberKey}`);
      if (!raw) return;
      const saved = JSON.parse(raw) as { shown?: number; scroll?: number };
      if (saved.shown && limit) setShown(Math.min(Math.max(saved.shown, limit), total));
      if (saved.scroll && boxRef.current) boxRef.current.scrollTop = saved.scroll;
    } catch {
      // Хранилище бывает закрыто настройками браузера. Список от этого работать не перестаёт.
    }
  }, [rememberKey, limit, total]);

  const remember = (nextShown: number) => {
    if (!rememberKey) return;
    try {
      window.localStorage.setItem(
        `whg:list:${rememberKey}`,
        JSON.stringify({ shown: nextShown, scroll: boxRef.current?.scrollTop ?? 0 }),
      );
    } catch {
      // см. выше
    }
  };

  // Подъезд к активной карточке. Ждём кадр отрисовки: до него у новой карточки
  // ещё нет своего места на экране.
  useEffect(() => {
    if (activeIndex === undefined || !boxRef.current) return;
    const box = boxRef.current;
    const card = box.children[activeIndex] as HTMLElement | undefined;
    if (!card) return;
    const frame = requestAnimationFrame(() => {
      const boxBox = box.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      const outside = cardBox.top < boxBox.top || cardBox.bottom > boxBox.bottom;
      if (outside) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, shown]);

  const showMore = () => {
    const next = Math.min(shown + (step ?? limit ?? total), total);
    setShown(next);
    remember(next);
  };

  const onScroll = () => {
    const box = boxRef.current;
    if (!box) return;
    remember(shown);
    if (more !== 'scroll' || shown >= total) return;
    // Порог в треть экрана: следующая порция готова к тому моменту, как человек
    // доберётся до низа, и список не дёргается под пальцем.
    const rest = box.scrollHeight - box.scrollTop - box.clientHeight;
    if (rest < box.clientHeight / 3) showMore();
  };

  if (total === 0) return <>{empty ?? null}</>;

  const hidden = total - shown;

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <ol
        ref={boxRef}
        onScroll={onScroll}
        aria-label={label}
        className={cn(
          'flex min-h-0 flex-col scroll-smooth',
          GAP[gap],
          maxHeight ? 'overflow-y-auto pr-1 [scrollbar-width:thin]' : 'overflow-visible',
        )}
        style={maxHeight ? { maxHeight } : undefined}
      >
        {items.slice(0, shown)}
      </ol>

      {hidden > 0 && more === 'button' && (
        <button
          type="button"
          onClick={showMore}
          className="mt-3 self-start rounded-lg border border-border bg-paper px-3 py-2 text-body text-muted transition-colors hover:border-border-strong hover:text-ink"
        >
          Показать ещё {Math.min(step ?? limit ?? hidden, hidden)} из {hidden}
        </button>
      )}
    </div>
  );
}
