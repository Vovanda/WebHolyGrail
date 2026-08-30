import { beforeEach, describe, expect, it } from 'vitest';

import { checkKeyRate, resetKeyRate } from './key-rate.js';

/**
 * Разница между просмотром и выкачиванием видна по темпу: зритель приходит за
 * ключом на каждой границе криптопериода, скачиватель - подряд и сразу.
 */

const VIEWER = 'viewer-1';
const NOW = 1_700_000_000_000;
const SECOND = 1000;
const MINUTE = 60 * SECOND;

/** Ключ очередного криптопериода одной записи. */
const key = (period: number, media = 87): string => `${media}:${period}`;

beforeEach(() => resetKeyRate());

describe('темп выдачи ключей', () => {
  it('просмотр подряд идёт сколько угодно долго', () => {
    // Часовая запись при минутном криптопериоде: шестьдесят обращений.
    // Прежний предел «шестьдесят в час» обрывал такой просмотр на середине.
    let now = NOW;
    for (let i = 0; i < 60; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), now).allowed).toBe(true);
      now += MINUTE;
    }
  });

  it('мелкая нарезка тоже проходит целиком', () => {
    // Самый мелкий криптопериод, какой разрешает настройка, - пять частей,
    // то есть двадцать секунд. Восполнение идёт ровно с этим шагом, поэтому
    // зритель не отстаёт даже на нём.
    let now = NOW;
    for (let i = 0; i < 120; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), now).allowed).toBe(true);
      now += 20 * SECOND;
    }
  });

  it('запас на буфер и перемотки есть', () => {
    // Плеер тянет вперёд и берёт ключи двух дорожек качества сразу.
    for (let i = 0; i < 30; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), NOW).allowed).toBe(true);
    }
  });

  it('три плеера одной записи на странице не съедают запас', () => {
    // Блок, текст и подборка просят один и тот же ключ - это один ключ,
    // а не три. С прежним счётом запросов витрина упиралась за две загрузки.
    for (let load = 0; load < 20; load += 1) {
      for (let player = 0; player < 3; player += 1) {
        expect(checkKeyRate(VIEWER, key(0), NOW).allowed).toBe(true);
        expect(checkKeyRate(VIEWER, key(1), NOW).allowed).toBe(true);
      }
    }

    // Запас при этом почти не тронут: разных ключей было всего два.
    for (let i = 2; i < 30; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), NOW).allowed).toBe(true);
    }
  });

  it('выкачивание подряд упирается в предел', () => {
    for (let i = 0; i < 30; i += 1) checkKeyRate(VIEWER, key(i), NOW);
    const decision = checkKeyRate(VIEWER, key(30), NOW);

    expect(decision.allowed).toBe(false);
    expect(decision.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('после паузы запас возвращается', () => {
    for (let i = 0; i < 31; i += 1) checkKeyRate(VIEWER, key(i), NOW);
    expect(checkKeyRate(VIEWER, key(31), NOW).allowed).toBe(false);

    expect(checkKeyRate(VIEWER, key(31), NOW + 20 * SECOND).allowed).toBe(true);
  });

  it('за ночь запас не накапливается сверх меры', () => {
    // Иначе к утру набирался бы запас, которым выкачивают курс залпом.
    const now = NOW + 12 * 60 * MINUTE;
    for (let i = 0; i < 30; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), now).allowed).toBe(true);
    }
    expect(checkKeyRate(VIEWER, key(30), now).allowed).toBe(false);
  });

  it('зрители не мешают друг другу', () => {
    for (let i = 0; i < 30; i += 1) checkKeyRate(VIEWER, key(i), NOW);
    expect(checkKeyRate(VIEWER, key(30), NOW).allowed).toBe(false);
    expect(checkKeyRate('viewer-2', key(0), NOW).allowed).toBe(true);
  });

  it('давно выданный ключ снова считается новым', () => {
    // Иначе набор «уже виденных» превратился бы в бесплатный проход: взял по
    // ключу в час, а к вечеру уносишь запись целиком мимо предела.
    checkKeyRate(VIEWER, key(0), NOW);

    // Через полчаса прежняя выдача забыта, а запас восполнен - тратим его
    // на другие ключи.
    const later = NOW + 31 * MINUTE;
    for (let i = 100; i < 130; i += 1) {
      expect(checkKeyRate(VIEWER, key(i), later).allowed).toBe(true);
    }

    expect(checkKeyRate(VIEWER, key(0), later).allowed).toBe(false);
  });
});
