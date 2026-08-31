import { describe, expect, it } from 'vitest';
import type { VideoSetItem } from 'contracts';

import { unlockGranted } from './granted-items';

/**
 * Обещать открытое там, где сервер откажет, хуже, чем оставить замок: зритель
 * нажимает и упирается.
 */

const item = (id: number, locked: boolean): VideoSetItem =>
  ({
    id,
    code: `c${id}`,
    title: `Запись ${id}`,
    playlistUrl: 'https://cdn/master.m3u8',
    poster: null,
    durationSeconds: 60,
    ready: true,
    locked,
    lockReason: locked ? 'not-entitled' : null,
  }) as VideoSetItem;

const list = [item(1, false), item(2, true), item(3, true)];

describe('снятие замков после кода', () => {
  it('код на подборку открывает все её записи', () => {
    const after = unlockGranted(list, { kind: 'playlists', id: 10 }, 10);
    expect(after.map((i) => i.locked)).toEqual([false, false, false]);
  });

  it('код на чужую подборку этот список не трогает', () => {
    // Событие приходит всем спискам страницы разом.
    const after = unlockGranted(list, { kind: 'playlists', id: 99 }, 10);
    expect(after.map((i) => i.locked)).toEqual([false, true, true]);
  });

  it('код на запись открывает только её', () => {
    const after = unlockGranted(list, { kind: 'media', id: 3 }, 10);
    expect(after.map((i) => i.locked)).toEqual([false, true, false]);
  });

  it('номер сравнивается по значению, а не по виду', () => {
    // Из адреса номер приходит строкой, из ответа - числом.
    const after = unlockGranted(list, { kind: 'media', id: '2' }, '10');
    expect(after[1]?.locked).toBe(false);
  });

  it('без сведений о выданном ничего не открывается', () => {
    expect(unlockGranted(list, null, 10)).toBe(list);
  });

  it('список без своего номера не открывается кодом на подборку', () => {
    // Иначе любой код снял бы замки там, где подборка неизвестна.
    const after = unlockGranted(list, { kind: 'playlists', id: 10 }, null);
    expect(after.map((i) => i.locked)).toEqual([false, true, true]);
  });

  it('состав доступа открывает всё, что в него входит', () => {
    // Доступ покрывает и чужую подборку, и одну запись здешней - открыться
    // должна запись, а не список целиком.
    const after = unlockGranted(
      list,
      [
        { kind: 'playlists', id: 99 },
        { kind: 'media', id: 3 },
      ],
      10,
    );
    expect(after.map((i) => i.locked)).toEqual([false, true, false]);
  });

  it('своя подборка в составе снимает замки со всего списка', () => {
    const after = unlockGranted(list, [{ kind: 'playlists', id: 10 }], 10);
    expect(after.map((i) => i.locked)).toEqual([false, false, false]);
  });

  it('пустой состав оставляет список прежним', () => {
    expect(unlockGranted(list, [], 10)).toBe(list);
  });

  it('состав, не касающийся списка, оставляет его прежним', () => {
    // Равенство важно: по нему список понимает, что снятие замков показывать
    // нечему.
    expect(unlockGranted(list, [{ kind: 'media', id: 777 }], 10)).toBe(list);
  });
});
