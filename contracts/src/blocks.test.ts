import { describe, expect, it } from 'vitest';

import { scopedAppearance } from './blocks';

describe('scopedAppearance', () => {
  it('держит стиль в границах блока', () => {
    expect(scopedAppearance('b7', 'margin: 40px 0')).toBe(
      '[data-block="b7"][data-block="b7"] { margin: 40px 0 }',
    );
  });

  it('целится в содержимое обёртки, когда признак стоит на ней', () => {
    expect(scopedAppearance('b7', 'padding-top: 0', 'child')).toBe(
      '[data-block="b7"][data-block="b7"] > * { padding-top: 0 }',
    );
  });

  it('правило владельца весит больше готовых классов', () => {
    /*
      Признак повторяется дважды намеренно. У частей компонента свойства заданы
      классами, и правило по признаку части весило бы столько же, сколько класс, -
      при равном весе побеждает то, что подключено позже, то есть стили сборки.
      Лишний признак поднимает вес всего вложенного и решает это независимо
      от порядка подключения.
    */
    const css = scopedAppearance('b7', '[data-part="dot"] { height: 9px }');
    const признаков = (css.match(/\[data-block="b7"\]/g) ?? []).length;
    expect(признаков).toBe(2);
    expect(css.startsWith('[data-block="b7"][data-block="b7"] {')).toBe(true);
  });

  it('поднимает вес и правилу по тегу, и правилу по классу', () => {
    const поТегу = scopedAppearance('b7', 'button { border-radius: 0 }');
    const поКлассу = scopedAppearance('b7', '.title { color: red }');
    for (const css of [поТегу, поКлассу]) {
      expect(css.startsWith('[data-block="b7"][data-block="b7"] {')).toBe(true);
    }
  });

  it('область видимости не выпускает правило наружу', () => {
    // закрывающий тег стиля вырезается: им можно было бы оборвать стиль в разметке
    expect(scopedAppearance('b7', '</style><script>alert(1)</script>')).toBe(
      '[data-block="b7"][data-block="b7"] { ><script>alert(1)</script> }',
    );
  });

  it('не пропускает стиль с оборванными скобками', () => {
    expect(scopedAppearance('b7', '} body { display: none }')).toBe('');
  });

  it('пустое значение не даёт правила', () => {
    expect(scopedAppearance('b7', '   ')).toBe('');
  });
});
