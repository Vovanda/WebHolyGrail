import { describe, expect, it } from 'vitest';

import { frameStyle } from './frame';

/**
 * Рамка кадра: ширина выводится из потолка высоты.
 *
 * @remarks
 * Ожидания записаны литералами, а не собраны тем же шаблоном, что в правиле:
 * собранное из тех же кусков совпадёт и при перевёрнутой пропорции, и тест
 * промолчит ровно о той ошибке, ради которой он написан.
 */
describe('frameStyle', () => {
  it('вертикальная запись сужается из потолка высоты', () => {
    const style = frameStyle('9/16');

    expect(style.aspectRatio).toBe('9/16');
    expect(style.maxHeight).toBe('var(--video-frame-max-h)');
    expect(style.width).toBe('min(100%, calc(var(--video-frame-max-h) * 9/16))');
    expect(style.marginInline).toBe('auto');
  });

  it('горизонтальная запись считается по своей пропорции', () => {
    expect(frameStyle('16/9').width).toBe('min(100%, calc(var(--video-frame-max-h) * 16/9))');
  });

  it('пропорция не перевёрнута: 9/16 и 16/9 дают разные ширины', () => {
    expect(frameStyle('9/16').width).not.toBe(frameStyle('16/9').width);
    expect(frameStyle('9/16').width).toContain('* 9/16)');
    expect(frameStyle('16/9').width).toContain('* 16/9)');
  });
});
