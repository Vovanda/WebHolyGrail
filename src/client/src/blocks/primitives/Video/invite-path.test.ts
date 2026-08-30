import { describe, expect, it } from 'vitest';

import { invitePath } from './invite-path';

/**
 * Приглашение открывают один раз: ошибка в адресе видна только тому, кто по
 * нему пришёл, и второй попытки у него нет.
 */

describe('адрес после приглашения', () => {
  it('ведёт на подборку человеческим адресом', () => {
    expect(invitePath({ kind: 'playlists' }, { channel: 'whg', code: 'ZGVTAYZ' })).toBe(
      '/@whg/p/ZGVTAYZ',
    );
  });

  it('ведёт на запись человеческим адресом', () => {
    expect(invitePath({ kind: 'media' }, { channel: 'whg', code: 'p5kHGPm' })).toBe(
      '/@whg/v/p5kHGPm',
    );
  });

  it('не собирает служебный путь', () => {
    // /channel/... работает, но остаётся в строке браузера, в закладках
    // и в поисковой выдаче вторым адресом той же страницы.
    const built = invitePath({ kind: 'playlists' }, { channel: 'whg', code: 'ZGVTAYZ' });
    expect(built).not.toContain('/channel/');
  });

  it('без вида ведёт на подборку', () => {
    // Приглашения на подборку - обычный случай, и вид может не прийти.
    expect(invitePath(undefined, { channel: 'whg', code: 'ZGVTAYZ' })).toBe('/@whg/p/ZGVTAYZ');
  });

  it('без адреса вести некуда', () => {
    expect(invitePath({ kind: 'playlists' }, null)).toBeNull();
    expect(invitePath({ kind: 'media' }, { channel: 'whg', code: '' })).toBeNull();
    expect(invitePath({ kind: 'media' }, { channel: '', code: 'p5kHGPm' })).toBeNull();
  });
});
