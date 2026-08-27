import { describe, expect, it } from 'vitest';

import { playlistFromAddress } from './VideoSetPanelSection';

/**
 * На странице отдельного видео панель должна показать тот плейлист, из которого
 * зритель пришёл, а не заданный в настройках. Ошибка здесь либо подменяет
 * плейлист чужим, либо оставляет панель пустой.
 */

describe('плейлист из адреса', () => {
  it('берётся из канала в пути и кода в запросе', () => {
    expect(playlistFromAddress('/@whg/v/RsrNVjJ', '?set=ZGVTAYZ')).toEqual({
      channel: 'whg',
      code: 'ZGVTAYZ',
    });
  });

  it('без кода в запросе остаётся настроенный', () => {
    expect(playlistFromAddress('/@whg/v/RsrNVjJ', '')).toBeNull();
    expect(playlistFromAddress('/@whg/v/RsrNVjJ', '?v=abc')).toBeNull();
  });

  it('вне канала кода мало', () => {
    expect(playlistFromAddress('/video', '?set=ZGVTAYZ')).toBeNull();
  });

  it('канал с русскими буквами читается', () => {
    expect(playlistFromAddress('/@%D0%BA%D0%B0%D0%BD%D0%B0%D0%BB/v/x', '?set=A1')).toEqual({
      channel: 'канал',
      code: 'A1',
    });
  });

  it('пустого адреса хватает, чтобы не упасть', () => {
    expect(playlistFromAddress(null, null)).toBeNull();
  });
});
