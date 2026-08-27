import { describe, expect, it } from 'vitest';

import { panelClasses } from './SidePanel';

/**
 * Панель слева и справа обязана вести себя одинаково и выглядеть зеркально.
 * Проверяем это правилом, а не глазами: правка одной стороны иначе легко
 * расходится с другой.
 *
 * Слой, сдвиг и движение живут в стилях: классы-утилиты лежат слоем выше
 * и перебивали правило для широкого экрана. Здесь проверяется то, что
 * осталось за классами, - сторона и привязка по высоте.
 */

function classes(side: 'left' | 'right', alignTop: 'screen' | 'trigger' = 'screen') {
  return panelClasses({ side, alignTop }).split(' ');
}

/** Всё, что не про сторону: должно совпадать у обеих панелей. */
function common(list: string[]): string[] {
  return list.filter((c) => !/^(left|right)-0$|^border-(l|r)$/.test(c));
}

describe('panelClasses', () => {
  it('оформление одинаковое с обеих сторон', () => {
    expect(common(classes('left'))).toEqual(common(classes('right')));
    expect(common(classes('left', 'trigger'))).toEqual(common(classes('right', 'trigger')));
  });

  it('стороны зеркальны: край экрана и граница напротив него', () => {
    expect(classes('left')).toContain('left-0');
    expect(classes('left')).toContain('border-r');
    expect(classes('right')).toContain('right-0');
    expect(classes('right')).toContain('border-l');
  });

  it('сдвиг задан стилями, а не классом', () => {
    for (const side of ['left', 'right'] as const) {
      expect(classes(side).join(' ')).not.toMatch(/translate-x/);
    }
  });

  it('верх задан стилями: панель начинается ниже шапки сайта', () => {
    for (const alignTop of ['screen', 'trigger'] as const) {
      expect(classes('left', alignTop)).not.toContain('top-0');
    }
  });

  it('начатая от кнопки панель отделена кромкой сверху', () => {
    expect(classes('left', 'trigger')).toContain('border-t');
    expect(classes('left', 'screen')).not.toContain('border-t');
  });

  it('угол не скругляется: скруглённый край читается как обрезанный кусок', () => {
    expect(classes('left', 'trigger')).not.toContain('rounded');
    expect(classes('right', 'trigger')).not.toContain('rounded');
  });
});
