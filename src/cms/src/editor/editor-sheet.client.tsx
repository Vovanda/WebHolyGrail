'use client';

import { createClientFeature } from '@payloadcms/richtext-lexical/client';

import { EditorSheetPlugin } from './editor-sheet.plugin';
import { toggleSheetAlign, useSheetAlign } from './sheet-align-store';
import { useToolbarIcon } from './toolbar-icon';

const LABEL = 'Лист по центру или слева';

/**
 * Кнопка положения листа.
 *
 * @remarks
 * Своя, а не штатная: штатная кнопка панели рисуется без подписи, и диктор
 * читает её безымянной. Классы те же, что у штатных, - вид не отличается.
 * Значок показывает, где лист стоит сейчас.
 */
function SheetAlignButton() {
  const align = useSheetAlign();
  const Icon = useToolbarIcon('align', align === 'left' ? 'alignLeft' : 'alignCenter');
  return (
    <button
      type="button"
      className="toolbar-popup__button toolbar-popup__button-sheet-align"
      title={LABEL}
      aria-label={LABEL}
      aria-pressed={align === 'left'}
      onClick={toggleSheetAlign}
    >
      {Icon ? <Icon /> : null}
    </button>
  );
}

/**
 * Лист в поле статьи и кнопка его положения в панели.
 *
 * @remarks
 * Кнопка стоит последней в панели: она про вид поля, а не про текст, и среди
 * кнопок оформления читалась бы как выравнивание абзаца.
 */
export const EditorSheetClientFeature = createClientFeature({
  plugins: [{ Component: EditorSheetPlugin, position: 'normal' }],
  toolbarFixed: {
    groups: [
      {
        type: 'buttons',
        key: 'sheet',
        order: 100,
        items: [{ Component: SheetAlignButton, key: 'sheet-align', label: LABEL }],
      },
    ],
  },
});
