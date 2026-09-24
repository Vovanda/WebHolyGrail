import { describe, expect, it } from 'vitest';

import { widthCapFor } from './media-network';

describe('предел ширины кадра по сети', () => {
  it('без сведений о сети предела нет', () => {
    expect(widthCapFor(null)).toBeNull();
    expect(widthCapFor(undefined)).toBeNull();
    expect(widthCapFor({})).toBeNull();
  });

  it('просьба экономить трафик - самая мелкая ступень на любой сети', () => {
    expect(widthCapFor({ saveData: true, effectiveType: '4g' })).toBe(400);
  });

  it('2g и медленнее - 400, 3g - 768, 4g - без предела', () => {
    expect(widthCapFor({ effectiveType: 'slow-2g' })).toBe(400);
    expect(widthCapFor({ effectiveType: '2g' })).toBe(400);
    expect(widthCapFor({ effectiveType: '3g' })).toBe(768);
    expect(widthCapFor({ effectiveType: '4g' })).toBeNull();
  });
});
