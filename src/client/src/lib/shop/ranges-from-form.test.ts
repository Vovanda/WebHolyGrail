import { cleanCharacteristics } from 'contracts';
import { describe, expect, it } from 'vitest';

import { rangesFromForm } from './page';

const chars = cleanCharacteristics([
  { key: 'hours', title: 'Часы', kind: 'number' },
  { key: 'format', title: 'Формат', kind: 'enum' },
]);

describe('поля диапазона в адрес фильтра', () => {
  it('без полей формы адрес уже канонический', () => {
    expect(rangesFromForm({ format: 'онлайн', q: 'сила' }, chars)).toBeNull();
  });

  it('пара полей сворачивается в min..max, остальное сохраняется', () => {
    const out = new URLSearchParams(
      rangesFromForm({ 'hours.min': ' 10 ', 'hours.max': '40', format: 'онлайн' }, chars)!,
    );
    expect(out.get('hours')).toBe('10..40');
    expect(out.get('format')).toBe('онлайн');
    expect(out.has('hours.min')).toBe(false);
  });

  it('открытая граница остаётся пустой', () => {
    expect(
      new URLSearchParams(rangesFromForm({ 'hours.min': '', 'hours.max': '5' }, chars)!).get(
        'hours',
      ),
    ).toBe('..5');
  });

  it('пустая форма снимает прежний диапазон', () => {
    expect(rangesFromForm({ hours: '10..40', 'hours.min': '', 'hours.max': '' }, chars)).toBe('');
  });
});
