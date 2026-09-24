'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type KeyboardEvent,
} from 'react';

import { pickerMatches } from './block-menu-items';

export interface PickerItem {
  readonly key: string;
  readonly label: string;
  readonly Icon?: FC | undefined;
}

/** Колонка, над которой стоит окно: левый край и ширина в точках окна. */
export interface PickerColumn {
  readonly left: number;
  readonly width: number;
}

interface BlockPickerProps {
  readonly items: readonly PickerItem[];
  readonly column: PickerColumn | null;
  /** С чего начинается поиск: набранное в слэш-меню. */
  readonly initialQuery?: string;
  readonly onPick: (key: string) => void;
  readonly onClose: () => void;
}

/**
 * Окно выбора блока: весь набор с поиском по названию.
 *
 * @remarks
 * Стоит над колонкой своего редактора, а не посреди экрана: рядом может быть
 * открыт предпросмотр, и окно не должно его закрывать. Колонку меряет
 * вызывающий; пока замера нет, окно занимает весь экран.
 *
 * Enter вставляет первый найденный блок. Esc и нажатие мимо окна закрывают -
 * в том числе нажатие по предпросмотру или меню админки, куда подложка
 * не достаёт.
 */
export function BlockPicker({
  items,
  column,
  initialQuery = '',
  onPick,
  onClose,
}: BlockPickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const titleId = useId();
  const box = useRef<HTMLDivElement>(null);
  const shown = items.filter((item) => pickerMatches(item, query));

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && onClose();
    const onPointer = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [onClose]);

  const pickFirst = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || !shown[0]) return;
    event.preventDefault();
    onPick(shown[0].key);
  };

  const place = column
    ? ({
        '--whg-picker-left': `${column.left}px`,
        '--whg-picker-width': `${column.width}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div className="whg-block-picker" style={place}>
      <div
        ref={box}
        className="whg-block-picker__box"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="whg-block-picker__head">
          <strong id={titleId}>Другие компоненты</strong>
          <button
            type="button"
            className="whg-block-picker__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </header>

        <input
          className="whg-block-picker__search"
          type="search"
          value={query}
          placeholder="Найти по названию"
          autoFocus
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={pickFirst}
        />

        <ul className="whg-block-picker__list">
          {shown.map(({ key, label, Icon }) => (
            <li key={key}>
              <button type="button" className="whg-block-picker__item" onClick={() => onPick(key)}>
                {Icon && <Icon />}
                <span>{label}</span>
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="whg-block-picker__empty">Ничего не нашлось</li>}
        </ul>
      </div>
    </div>
  );
}
