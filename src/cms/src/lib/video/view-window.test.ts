import { describe, expect, it } from 'vitest';

import { countsAsView, VIEW_WINDOW_SECONDS } from './view-window.js';

/**
 * Зеркало секции о просмотре в spec/video/access-invariants.smt2.
 *
 * @remarks
 * Ключ спрашивают на каждый отрезок потока. Считать просмотром каждый запрос
 * нельзя: право на три просмотра сгорело бы за полминуты.
 */

const NOW = 1_700_000_000;

describe('окно просмотра', () => {
  it('внутри окна: повторное взятие ключа новым просмотром не считается', () => {
    expect(countsAsView(NOW - 60, NOW)).toBe(false);
  });

  it('на границе окна просмотр ещё тот же', () => {
    expect(countsAsView(NOW - VIEW_WINDOW_SECONDS, NOW)).toBe(false);
  });

  it('за окном: возврат считается новым просмотром', () => {
    expect(countsAsView(NOW - VIEW_WINDOW_SECONDS - 1, NOW)).toBe(true);
  });

  it('первое взятие: отметки нет, просмотр считается', () => {
    expect(countsAsView(null, NOW)).toBe(true);
  });

  it('окно длиной в сутки', () => {
    // Вернулся назавтра - второй просмотр. Меньшая величина резала бы право
    // тому, кто пересматривает запись в тот же вечер.
    expect(VIEW_WINDOW_SECONDS).toBe(24 * 60 * 60);
  });
});
