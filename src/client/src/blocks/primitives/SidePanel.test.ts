import { describe, expect, it } from 'vitest';

import { panelClasses } from './SidePanel';

/**
 * Панель слева и справа обязана вести себя одинаково и выглядеть зеркально.
 * Проверяем это правилом, а не глазами: правка одной стороны иначе легко
 * расходится с другой.
 */

function classes(side: 'left' | 'right', open: boolean, alignTop: 'screen' | 'trigger' = 'screen') {
  return panelClasses({ side, open, alignTop }).split(' ');
}

/** Всё, что не про сторону: должно совпадать у обеих панелей. */
function common(list: string[]): string[] {
  return list.filter((c) => !/^(left|right)-0$|^border-(l|r)$|translate-x/.test(c));
}

describe('panelClasses', () => {
  it('оформление и движение одинаковые с обеих сторон', () => {
    expect(common(classes('left', true))).toEqual(common(classes('right', true)));
    expect(common(classes('left', false))).toEqual(common(classes('right', false)));
  });

  it('стороны зеркальны: край экрана и граница напротив него', () => {
    expect(classes('left', true)).toContain('left-0');
    expect(classes('left', true)).toContain('border-r');
    expect(classes('right', true)).toContain('right-0');
    expect(classes('right', true)).toContain('border-l');
  });

  it('закрытая панель уезжает в свою сторону', () => {
    expect(classes('left', false)).toContain('-translate-x-full');
    expect(classes('right', false)).toContain('translate-x-full');
    expect(classes('left', false)).not.toContain('translate-x-0');
  });

  it('открытая панель стоит на месте с обеих сторон', () => {
    expect(classes('left', true)).toContain('translate-x-0');
    expect(classes('right', true)).toContain('translate-x-0');
  });

  it('движение берёт длительность и кривую страницы', () => {
    for (const side of ['left', 'right'] as const) {
      const list = classes(side, true).join(' ');
      expect(list).toContain('var(--panel-motion-duration)');
      expect(list).toContain('var(--panel-motion-ease)');
    }
  });

  it('панель на уровне кнопки получает скруглённый верх, а не прижимается к краю', () => {
    expect(classes('left', true, 'trigger')).toContain('rounded-t-xl');
    expect(classes('left', true, 'trigger')).not.toContain('top-0');
    expect(classes('right', true, 'screen')).toContain('top-0');
  });
});
