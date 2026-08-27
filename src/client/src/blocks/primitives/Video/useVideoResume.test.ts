import { describe, expect, it } from 'vitest';

import { shouldResume } from './useVideoResume';

/**
 * Ошибка здесь стоит дорого: человек попадает на титры вместо начала или
 * теряет место, до которого досмотрел.
 */

const base = { duration: 600, stopBefore: 20, hasTimecode: false };

describe('возврат к месту просмотра', () => {
  it('к сохранённой середине возвращаемся', () => {
    expect(shouldResume({ ...base, saved: 300 })).toBe(true);
  });

  it('без сохранённого места возвращать некуда', () => {
    expect(shouldResume({ ...base, saved: null })).toBe(false);
    expect(shouldResume({ ...base, saved: 0 })).toBe(false);
  });

  it('досмотренную запись открываем заново, а не на титрах', () => {
    expect(shouldResume({ ...base, saved: 595 })).toBe(false);
    expect(shouldResume({ ...base, saved: 580 })).toBe(false);
  });

  it('ссылка на конкретное место главнее памяти', () => {
    expect(shouldResume({ ...base, saved: 300, hasTimecode: true })).toBe(false);
  });

  it('пока длительность неизвестна, никуда не прыгаем', () => {
    expect(shouldResume({ ...base, saved: 300, duration: 0 })).toBe(false);
  });

  it('ровно на границе досмотра ещё возвращаемся', () => {
    expect(shouldResume({ ...base, saved: 580, stopBefore: 20 })).toBe(false);
    expect(shouldResume({ ...base, saved: 579, stopBefore: 20 })).toBe(true);
  });
});
