'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Закрывает открытые `Dropdown` по щелчку мимо, по Esc и после перехода.
 *
 * @remarks
 * Один на страницу. `<details>` сам по себе закрывается только своей кнопкой:
 * без помощника выбранное значение уводило на новый адрес, а панель так и
 * оставалась открытой поверх выдачи.
 */
export function DropdownCloser() {
  const pathname = usePathname();
  const search = useSearchParams();

  useEffect(() => {
    const closeAll = (except?: Element | null) => {
      for (const d of document.querySelectorAll<HTMLDetailsElement>(
        'details[data-dropdown][open]',
      )) {
        if (!except || !d.contains(except)) d.open = false;
      }
    };
    const onClick = (event: MouseEvent) => closeAll(event.target as Element);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAll();
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Выбор внутри панели - переход по адресу: после него панели закрыты.
  useEffect(() => {
    for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-dropdown][open]')) {
      d.open = false;
    }
  }, [pathname, search]);

  return null;
}
