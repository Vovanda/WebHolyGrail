import { describe, expect, it } from 'vitest';

import { currentEnvironment, decideAll, isToggleOn } from './decide.js';

/**
 * Переключатель меняет сайт для всех сразу, поэтому правила должны быть
 * однозначными: ошибка здесь либо показывает недоделанное всем, либо прячет
 * готовое.
 */

const now = new Date('2026-08-27T10:00:00Z');

describe('решение о признаке', () => {
  it('без признака ничего не включаем', () => {
    expect(isToggleOn(null, { environment: 'production', now })).toBe(false);
    expect(isToggleOn(undefined, { environment: 'production', now })).toBe(false);
  });

  it('галочка окружения решает, когда времени не назначено', () => {
    const record = { key: 'x', production: true, staging: false, development: false };
    expect(isToggleOn(record, { environment: 'production', now })).toBe(true);
    expect(isToggleOn(record, { environment: 'staging', now })).toBe(false);
    expect(isToggleOn(record, { environment: 'development', now })).toBe(false);
  });

  it('назначенное время включает признак, когда пришло', () => {
    const record = { key: 'x', production: false, enableAt: '2026-08-27T09:00:00Z' };
    expect(isToggleOn(record, { environment: 'production', now })).toBe(true);
  });

  it('до назначенного времени признак выключен даже с галочкой', () => {
    const record = { key: 'x', production: true, enableAt: '2026-08-28T09:00:00Z' };
    expect(isToggleOn(record, { environment: 'production', now })).toBe(false);
  });

  it('негодная дата решения не принимает: опечатка не включает возможность', () => {
    const record = { key: 'x', production: true, enableAt: 'позавчера' };
    expect(isToggleOn(record, { environment: 'production', now })).toBe(true);
  });

  it('свод по всем признакам собирается одним куском', () => {
    const all = decideAll(
      [
        { key: 'a', production: true },
        { key: 'b', production: false },
      ],
      { environment: 'production', now },
    );
    expect(all).toEqual({ a: true, b: false });
  });
});

describe('где мы находимся', () => {
  it('понимает привычные написания', () => {
    expect(currentEnvironment('production')).toBe('production');
    expect(currentEnvironment('prod')).toBe('production');
    expect(currentEnvironment('staging')).toBe('staging');
    expect(currentEnvironment('stage')).toBe('staging');
  });

  it('без значения считаем, что это машина разработчика', () => {
    expect(currentEnvironment(null)).toBe('development');
    expect(currentEnvironment('')).toBe('development');
    expect(currentEnvironment('мусор')).toBe('development');
  });
});
