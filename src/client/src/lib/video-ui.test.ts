import { describe, expect, it } from 'vitest';

import { VIDEO_UI_TOGGLE, videoUiFrom } from './video-ui';

/**
 * Слой управления меняет плеер для всех сразу, поэтому неизвестное состояние
 * должно приводить к привычному виду, а не к урезанному.
 */

describe('слой плеера', () => {
  it('признак включён - готовый слой', () => {
    expect(videoUiFrom({ [VIDEO_UI_TOGGLE]: true })).toBe('vidstack');
  });

  it('признак выключен - свой слой', () => {
    expect(videoUiFrom({ [VIDEO_UI_TOGGLE]: false })).toBe('chrome');
  });

  it('свод не ответил - остаётся готовый слой', () => {
    expect(videoUiFrom({})).toBe('vidstack');
  });
});
