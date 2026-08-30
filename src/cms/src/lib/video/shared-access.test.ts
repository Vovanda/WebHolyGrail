import { beforeEach, describe, expect, it } from 'vitest';

import { noteKeyRequest, resetSharedAccess } from './shared-access.js';

const NOW = 1_700_000_000_000;
const MINUTE = 60 * 1000;

beforeEach(() => resetSharedAccess());

describe('складчина по обращениям за ключами', () => {
  it('один зритель подряд остаётся одной линией', () => {
    noteKeyRequest('право-1', 'дом', 0, NOW);
    noteKeyRequest('право-1', 'дом', 1, NOW + MINUTE);
    const report = noteKeyRequest('право-1', 'дом', 2, NOW + 2 * MINUTE);

    expect(report.lines).toBe(1);
    expect(report.shared).toBe(false);
  });

  it('телефон рядом с компьютером не считается складчиной', () => {
    noteKeyRequest('право-1', 'дом', 0, NOW);
    const report = noteKeyRequest('право-1', 'телефон', 0, NOW + 1000);

    expect(report.lines).toBe(2);
    expect(report.shared).toBe(false);
  });

  it('четвёртая линия под одним правом - уже складчина', () => {
    noteKeyRequest('право-1', 'первый', 0, NOW);
    noteKeyRequest('право-1', 'второй', 0, NOW + 1000);
    noteKeyRequest('право-1', 'третий', 0, NOW + 2000);
    const report = noteKeyRequest('право-1', 'четвёртый', 0, NOW + 3000);

    expect(report.lines).toBe(4);
    expect(report.shared).toBe(true);
  });

  it('линии в разных местах записи видны отдельно от их числа', () => {
    // Один в начале, другой в середине - это не два устройства одного человека.
    noteKeyRequest('право-1', 'первый', 0, NOW);
    const report = noteKeyRequest('право-1', 'второй', 20, NOW + 1000);

    expect(report.lines).toBe(2);
    expect(report.shared).toBe(false);
    expect(report.apart).toBe(true);
  });

  it('соседние места расхождением не считаются', () => {
    // Две вкладки одного человека идут рядом.
    noteKeyRequest('право-1', 'вкладка-1', 4, NOW);
    const report = noteKeyRequest('право-1', 'вкладка-2', 5, NOW + 1000);

    expect(report.apart).toBe(false);
  });

  it('забытая линия отпускает право', () => {
    noteKeyRequest('право-1', 'вчерашний', 0, NOW);
    const report = noteKeyRequest('право-1', 'сегодняшний', 0, NOW + 31 * MINUTE);

    expect(report.lines).toBe(1);
  });

  it('права не мешаются между собой', () => {
    noteKeyRequest('право-1', 'первый', 0, NOW);
    noteKeyRequest('право-1', 'второй', 0, NOW);
    const report = noteKeyRequest('право-2', 'третий', 0, NOW);

    expect(report.lines).toBe(1);
  });
});
