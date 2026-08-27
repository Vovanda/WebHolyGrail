import { describe, expect, it } from 'vitest';

import { envNameFor, keyFromEnvName, readEnvToggles } from './env.js';

/**
 * Переменная из хранилища секретов перекрывает галочку в админке, поэтому
 * разбор должен быть строгим: лишнее опознанное имя включит возможность всем.
 */

describe('имя переменной', () => {
  it('строится из признака', () => {
    expect(envNameFor('video.layout.vendor')).toBe('TOGGLE_VIDEO_LAYOUT_VENDOR');
  });

  it('читается обратно', () => {
    expect(keyFromEnvName('TOGGLE_VIDEO_LAYOUT_VENDOR')).toBe('video.layout.vendor');
  });

  it('чужую переменную не принимает', () => {
    expect(keyFromEnvName('DATABASE_URI')).toBeNull();
    expect(keyFromEnvName('TOGGLE_')).toBeNull();
  });
});

describe('разбор окружения', () => {
  it('понимает привычные написания', () => {
    const value = readEnvToggles({
      TOGGLE_A: '1',
      TOGGLE_B: 'true',
      TOGGLE_C: ' ON ',
      TOGGLE_D: 'yes',
      TOGGLE_E: '0',
      TOGGLE_F: 'off',
    });

    expect(value).toEqual({ a: true, b: true, c: true, d: true, e: false, f: false });
  });

  it('непонятное значение пропускает, чтобы опечатка не гасила работающее', () => {
    expect(readEnvToggles({ TOGGLE_A: 'truue' })).toEqual({});
  });

  it('чужие переменные не трогает', () => {
    expect(readEnvToggles({ PAYLOAD_SECRET: 'true' })).toEqual({});
  });
});
