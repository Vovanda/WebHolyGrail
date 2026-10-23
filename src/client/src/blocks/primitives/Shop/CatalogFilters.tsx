'use client';

import { useEffect, useState } from 'react';

import { SidePanel } from '../SidePanel';
import { primaryButton, secondaryButton } from './ui';

/** Узкий экран: фильтр уходит в боковую панель (docs/whg/44-catalog-search.md, «Фильтр»). */
const NARROW = '(max-width: 1023px)';
/** Панель была открыта перед переходом: фильтр работает ссылками, и страница перезагружается. */
const REOPEN = 'whg-filters-open';

/**
 * Фильтр раздела каталога: колонка слева на широком экране, боковая панель на узком.
 *
 * @remarks
 * Части: кнопка «Фильтры» со счётом выбранного, панель с самим фильтром,
 * «Показать N товаров» внизу панели. Панель сдвигает страницу (`SidePanel`,
 * режим push из whg-layouts): фильтр - часть той же работы, а не окно поверх.
 *
 * Фильтр приходит готовым с сервера и в разметке один: на широком экране он стоит
 * в колонке, на узком - в панели. Каждый выбор - переход по адресу, поэтому панель
 * помнит, что была открыта, и после перехода открывается снова уже с новым числом
 * найденного: человек выбирает несколько значений подряд, не открывая её заново.
 */
export function SectionFilters({
  found,
  selected,
  children,
}: {
  /** Сколько позиций найдено при текущем выборе. */
  readonly found: number;
  /** Сколько значений фильтра выбрано - на кнопке. */
  readonly selected: number;
  readonly children: React.ReactNode;
}) {
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(NARROW);
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    try {
      if (query.matches && window.sessionStorage.getItem(REOPEN)) setOpen(true);
      window.sessionStorage.removeItem(REOPEN);
    } catch {
      // Хранилище недоступно - панель просто не откроется сама после выбора.
    }
    return () => query.removeEventListener('change', sync);
  }, []);

  // Выбор внутри панели уводит на новый адрес: запоминаем, что её надо открыть снова.
  const remember = (event: React.SyntheticEvent) => {
    const target = event.target as HTMLElement;
    if (event.type === 'submit' || target.closest('a[href]')) {
      try {
        window.sessionStorage.setItem(REOPEN, '1');
      } catch {
        // См. выше.
      }
    }
  };

  if (!narrow) return <div data-part="filter">{children}</div>;

  return (
    <SidePanel
      side="left"
      title="Фильтры"
      open={open}
      onOpenChange={setOpen}
      trigger={({ open: show }) => (
        <button type="button" onClick={show} data-part="filter-toggle" className={secondaryButton}>
          Фильтры{selected > 0 ? ` · ${selected}` : ''}
        </button>
      )}
    >
      <div data-part="filter" onClickCapture={remember} onSubmitCapture={remember}>
        {children}
      </div>
      <div className="sticky bottom-0 -mx-4 mt-6 border-t border-border bg-[inherit] px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          data-part="filter-show"
          className={`${primaryButton} w-full`}
        >
          {found > 0 ? `Показать ${found}` : 'Ничего не найдено'}
        </button>
      </div>
    </SidePanel>
  );
}
