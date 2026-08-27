import { describe, expect, it } from 'vitest';

import { scopedAppearance } from './blocks';

describe('scopedAppearance', () => {
  it('держит стиль в границах блока', () => {
    expect(scopedAppearance('b7', 'margin: 40px 0')).toBe('[data-block="b7"] { margin: 40px 0 }');
  });

  it('целится в содержимое обёртки, когда признак стоит на ней', () => {
    expect(scopedAppearance('b7', 'padding-top: 0', 'child')).toBe(
      '[data-block="b7"] > * { padding-top: 0 }',
    );
  });

  it('не пропускает стиль с оборванными скобками', () => {
    expect(scopedAppearance('b7', '} body { display: none }')).toBe('');
  });

  it('пустое значение не даёт правила', () => {
    expect(scopedAppearance('b7', '   ')).toBe('');
  });
});
