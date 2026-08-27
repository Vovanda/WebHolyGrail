import { describe, expect, it } from 'vitest';
import type { VideoSetItem } from 'contracts';

import { neighboursOf, playableOf, selectVideo } from './selected-video';

/**
 * Выбор решает, что зритель увидит в кадре, поэтому ошибка здесь либо показывает
 * пустоту вместо видео, либо уводит на закрытое.
 */

function item(over: Partial<VideoSetItem> & { id: number; code: string }): VideoSetItem {
  return {
    title: 'Видео',
    poster: null,
    playlistUrl: 'https://example.test/master.m3u8',
    locked: false,
    ready: true,
    ...over,
  } as VideoSetItem;
}

const items = [
  item({ id: 1, code: 'aaa', locked: true }),
  item({ id: 2, code: 'bbb' }),
  item({ id: 3, code: 'ccc', ready: false }),
  item({ id: 4, code: 'ddd' }),
];

describe('какие видео заиграют', () => {
  it('закрытые и ненарезанные не берутся', () => {
    expect(playableOf(items).map((i) => i.code)).toEqual(['bbb', 'ddd']);
  });
});

describe('выбор по адресу', () => {
  it('берёт названное в адресе', () => {
    expect(selectVideo(items, 'ddd')?.code).toBe('ddd');
  });

  it('без адреса берёт первое играющее, а не первое в списке', () => {
    expect(selectVideo(items, null)?.code).toBe('bbb');
  });

  it('код закрытого видео не уводит на замок', () => {
    expect(selectVideo(items, 'aaa')?.code).toBe('bbb');
  });

  it('чужой код не ломает страницу', () => {
    expect(selectVideo(items, 'нет-такого')?.code).toBe('bbb');
  });

  it('играть нечему - показывать нечего', () => {
    expect(selectVideo([item({ id: 9, code: 'zzz', locked: true })], null)).toBeNull();
  });
});

describe('соседи', () => {
  it('у первого нет предыдущего', () => {
    const { prev, next } = neighboursOf(items, selectVideo(items, 'bbb'));
    expect(prev).toBeUndefined();
    expect(next?.code).toBe('ddd');
  });

  it('закрытые в соседи не попадают', () => {
    const { prev, next } = neighboursOf(items, selectVideo(items, 'ddd'));
    expect(prev?.code).toBe('bbb');
    expect(next).toBeUndefined();
  });
});
