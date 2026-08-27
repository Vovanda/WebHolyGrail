'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

/**
 * Боковая панель, которая сдвигает контент, а не перекрывает его.
 *
 * @remarks
 * Второй режим боковой панели рядом с overlay-drawer навигации: там окно
 * ложится поверх страницы, здесь страница отъезжает. Разница по смыслу: overlay
 * говорит «вернись, когда закончишь», сдвиг — «это часть той же работы»,
 * поэтому список серии, оглавление и фильтры удобнее сдвигом.
 *
 * Состояние живёт внутри панели, а центр отодвигается правилом в стилях по
 * признаку на `body`. Это сделано намеренно: конфигурация панелей у нас
 * сериализуемая (R5+) и React-узлов не хранит, а поднимать состояние в лейаут
 * ради одного числа значило бы связать его со всеми страницами сразу.
 *
 * На узком экране страница отъезжает целиком, на широком — ужимается: место
 * есть, и выталкивать правый край за экран незачем.
 */
export interface SidePanelProps {
  /** Кнопка, которая открывает панель. Рисуется вызывающим кодом. */
  readonly trigger: (props: { open: () => void; isOpen: boolean }) => React.ReactNode;
  readonly children: React.ReactNode;
  readonly side?: 'left' | 'right';
  /**
   * Ширина панели: она же задаёт, насколько отъезжает контент.
   *
   * @remarks
   * На телефоне панель занимает почти весь экран, оставляя полоску страницы
   * сбоку. Полоска нужна: по ней видно, что страница никуда не делась и лежит
   * рядом, а нажатие по ней возвращает обратно.
   */
  readonly width?: string;
  readonly title?: string | undefined;
  /** Наименьший отступ сверху, когда кнопка уехала за верх экрана: под шапку сайта. */
  readonly minTop?: number;
  /**
   * Откуда панель начинается по высоте.
   *
   * @remarks
   * `screen` - от верхнего края, во всю высоту: так ведёт себя навигация.
   * `trigger` - от кнопки, которой её открыли. Второе нужно там, где выше
   * кнопки на странице стоит что-то своё - баннер, заголовок плейлиста, - и
   * панель во весь экран накрывала бы его, а список оказывался бы далеко от
   * места, куда человек нажал.
   */
  readonly alignTop?: 'screen' | 'trigger';
  readonly className?: string;
}

/** Сколько карточек должно быть видно, чтобы список читался списком. */
const MIN_VISIBLE_CARDS = 3;

export function SidePanel({
  trigger,
  children,
  side = 'left',
  width = 'min(20rem, 86vw)',
  title,
  minTop = 80,
  alignTop = 'screen',
  className,
}: SidePanelProps) {
  const [open, setOpen] = useState(false);
  // Портал доступен только в браузере: на сервере узла body ещё нет.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  // Верх панели: с какой высоты экрана она начинается.
  const [top, setTop] = useState(0);

  /*
    Верх панели держится уровня кнопки, пока та видна, и прилипает к верху
    экрана, когда кнопка уезжает выше. Страница при этом стоит на месте:
    человек нажал в середине статьи и остался там же, а список появился рядом.
  */
  const followTrigger = useCallback(() => {
    if (alignTop !== 'trigger') return;
    // На телефоне панель занимает экран целиком и идёт от верха: равняться там
    // не с чем - страницы рядом не видно, а кнопка остаётся за кадром.
    if (window.innerWidth < 1024) {
      setTop(0);
      return;
    }
    // Координаты берём у самой кнопки: обёртка стоит с `display: contents`,
    // своего бокса не имеет и отдаёт нули.
    const rect = triggerRef.current?.firstElementChild?.getBoundingClientRect();
    if (!rect) return;

    let next = Math.max(rect.top, minTop);

    /*
      Панель, начатая слишком низко, показывает пустоту и край первой карточки.
      Считаем, сколько нужно на три карточки с шапкой, и поднимаем верх ровно
      настолько, чтобы они поместились.

      Три - тот минимум, по которому видно, что это список, а не одинокая
      карточка внизу экрана.
    */
    const panel = panelRef.current;
    const card = panel?.querySelector('li, [data-panel-card]');
    const head = panel?.firstElementChild;
    if (card && head) {
      const needed =
        card.getBoundingClientRect().height * MIN_VISIBLE_CARDS +
        head.getBoundingClientRect().height;
      const available = window.innerHeight - next;
      if (available < needed) next = Math.max(minTop, window.innerHeight - needed);
    }

    setTop(next);
  }, [alignTop, minTop]);

  useEffect(() => {
    if (!open || alignTop !== 'trigger') return;
    followTrigger();
    window.addEventListener('scroll', followTrigger, { passive: true });
    window.addEventListener('resize', followTrigger);
    return () => {
      window.removeEventListener('scroll', followTrigger);
      window.removeEventListener('resize', followTrigger);
    };
  }, [open, alignTop, followTrigger]);

  /*
    Сколько отодвинуто с каждой стороны. Стороны считаются порознь: при
    открытой левой и открывшейся правой страница доезжает на разницу одним
    движением. С общим признаком на обе стороны сдвиг менял знак и проходил
    через ноль - страница дёргалась к исходному месту и обратно.
  */
  useEffect(() => {
    if (!open) return;
    const body = document.body;
    const key = side === 'left' ? '--side-panel-left' : '--side-panel-right';
    body.dataset[side === 'left' ? 'sidePanelLeft' : 'sidePanelRight'] = 'open';
    body.style.setProperty(key, width);
    return () => {
      delete body.dataset[side === 'left' ? 'sidePanelLeft' : 'sidePanelRight'];
      body.style.removeProperty(key);
    };
  }, [open, side, width]);

  /*
    Пока тянут край окна, движение выключено.

    Ширина панели и отступ страницы считаются от ширины окна, а на них висит
    переход - при плавном растягивании каркас догонял окно с задержкой и всё
    дёргалось. Признак снимается через мгновение после последнего изменения,
    и обычное открытие панели снова идёт с движением.
  */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function onResize() {
      document.body.dataset['resizing'] = 'true';
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        delete document.body.dataset['resizing'];
      }, 160);
    }

    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (timer) clearTimeout(timer);
      delete document.body.dataset['resizing'];
    };
  }, []);

  /*
    Нажатие мимо панели её закрывает, и при этом доходит до того, на что
    нажали: кнопки в шапке - тема, меню - остаются рабочими с первого раза.
    Прозрачный слой поверх страницы съедал бы это первое нажатие.

    Закрываем по нажатию целиком, а не по его началу. На узком окне страница
    возвращается на всю ширину панели, и кнопка, которая едет вместе с ней,
    успевала уйти из-под пальца между началом нажатия и его концом: панель
    закрывалась, а меню не открывалось - приходилось нажимать второй раз.
    К концу нажатия кнопка своё уже отработала.
  */
  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  const toggle = () => {
    followTrigger();
    setOpen((value) => !value);
  };

  return (
    <>
      <span ref={triggerRef} className="contents">
        {trigger({ open: toggle, isOpen: open })}
      </span>

      {/*
        Панель живёт в самом низу страницы, отдельно от каркаса.
        Каркас при открытии отъезжает целиком, а `fixed` внутри сдвинутого
        родителя отсчитывается от него же - панель уехала бы вместе со
        страницей и скрылась за краем экрана.
      */}
      {mounted &&
        createPortal(
          <>
            <aside
              ref={panelRef}
              aria-hidden={!open}
              // Признаки читает CSS: на широком экране панель не выезжает, а
              // проступает из-под страницы, и правило должно знать сторону
              // и состояние.
              data-open={open ? 'true' : 'false'}
              data-side={side}
              // Ширина идёт переменной, а не готовым правилом: на широком экране
              // её задаёт раскладка - панель встаёт вплотную к средней секции,
              // и заданное здесь число там только мешало бы.
              style={
                {
                  '--side-panel-width': width,
                  ...(alignTop === 'trigger' ? { top: `${top}px` } : {}),
                } as React.CSSProperties
              }
              className={cn('side-panel--push', panelClasses({ side, alignTop }), className)}
            >
              {/*
                Шапка панели стоит на месте: прокручивается только содержимое.
                Иначе вместе со словом уезжает и закрытие, а другого видимого
                способа закрыть панель нет.
              */}
              {/*
                Шапка панели идёт вровень с шапкой сайта: та же высота, та же
                нижняя кромка. Иначе панель читается как приклеенная сбоку,
                а не как часть той же страницы.
              */}
              <div className="flex h-[var(--header-height)] shrink-0 items-center justify-between gap-2 border-b border-border px-4">
                <span className="text-body font-medium text-ink">{title ?? 'Панель'}</span>
                {/* Тот же вид, что у кнопки меню: обе живут в одной полосе по верху. */}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Закрыть"
                  className="action-button"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {/* Прокручивается содержимое, а не панель целиком. */}
              <div className="side-panel__body flex-1 overflow-y-auto overscroll-contain p-4">
                {children}
              </div>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}

/**
 * Классы панели: положение, оформление и состояние.
 *
 * @remarks
 * Вынесено отдельной функцией, чтобы левая и правая стороны оставались
 * зеркальными. Раньше это проверялось только глазами, и любая правка одной
 * стороны легко расходилась с другой.
 *
 * Панель читается как углубление в странице: фон темнее и по верхней кромке
 * идёт тень внутрь. Без этого список висит на том же фоне, что и страница.
 *
 * Длительность и кривая движения общие со страницей: панель и содержимое едут
 * как одно целое, без догоняющего рывка.
 */
export function panelClasses({
  side,
  alignTop,
}: {
  readonly side: 'left' | 'right';
  readonly alignTop: 'screen' | 'trigger';
}): string {
  const mirrored = side === 'left';
  // Слой, сдвиг и движение заданы в стилях по признакам `data-open`
  // и `data-side`: классы-утилиты лежат слоем выше и перебивали правило
  // для широкого экрана, из-за чего панель влетала от края вместо того,
  // чтобы проступить на месте.
  return [
    'fixed bottom-0 flex flex-col overflow-hidden',
    // Начатая от кнопки панель не скругляется: скруглённый угол читается как
    // обрезанный кусок, а панель - это край экрана, а не карточка.
    //
    // Верх задан в стилях, а не классом: на широком экране панель начинается
    // ниже шапки сайта - шапка лежит слоем выше и накрывала бы её.
    alignTop === 'trigger' ? 'border-t' : '',
    // Заливка задана в стилях: она считается от фона листа, а классом
    // перебивалась бы.
    'border-border shadow-[inset_0_2px_6px_-4px_rgb(0_0_0/0.35)]',
    // Границы с обеих сторон: на широком экране панель встаёт по краю страницы,
    // а до края окна остаётся ещё поле, и внешний край панели повисает в пустоте.
    // Прижатая к краю окна вторую границу не показывает - она уходит за край.
    'border-x',
    mirrored ? 'left-0' : 'right-0',
  ]
    .filter(Boolean)
    .join(' ');
}
