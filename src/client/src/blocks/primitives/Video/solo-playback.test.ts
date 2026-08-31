import { describe, expect, it, vi } from 'vitest';

import { pauseOthers, type Playable } from './solo-playback';

/** Проигрыватель, у которого можно спросить, останавливали ли его. */
function player(paused: boolean): Playable & { pause: ReturnType<typeof vi.fn> } {
  return { paused, pause: vi.fn() };
}

describe('pauseOthers', () => {
  it('останавливает всех, кроме запущенного', () => {
    const started = player(false);
    const other = player(false);

    expect(pauseOthers(started, [started, other])).toBe(1);
    expect(other.pause).toHaveBeenCalledOnce();
    expect(started.pause).not.toHaveBeenCalled();
  });

  it('не трогает того, кто и так стоит', () => {
    // Иначе пауза приходила бы каждому при любом запуске, и место просмотра
    // сбрасывалось бы у плееров, которых зритель не касался.
    const started = player(false);
    const idle = player(true);

    expect(pauseOthers(started, [started, idle])).toBe(0);
    expect(idle.pause).not.toHaveBeenCalled();
  });

  it('останавливает сразу нескольких', () => {
    const started = player(false);
    const first = player(false);
    const second = player(false);

    expect(pauseOthers(started, [first, started, second])).toBe(2);
  });

  it('один на странице никого не останавливает', () => {
    const started = player(false);
    expect(pauseOthers(started, [started])).toBe(0);
  });

  it('остановленный помнит место', () => {
    // Правило только ставит на паузу и времени не касается - иначе зритель
    // возвращался бы к началу каждый раз, когда рядом запустили другое видео.
    const started = player(false);
    const watching = { ...player(false), currentTime: 42 };

    pauseOthers(started, [started, watching]);

    expect(watching.pause).toHaveBeenCalledOnce();
    expect(watching.currentTime).toBe(42);
  });
});
