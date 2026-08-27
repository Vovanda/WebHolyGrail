import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { isDarkImage } from './image-luma.js';

/**
 * По этому признаку выбирается цвет текста поверх обложки. Ошибка здесь -
 * белые буквы на снежном поле или чёрные на ночном кадре.
 */

const однотонная = (r: number, g: number, b: number) =>
  sharp({ create: { width: 8, height: 8, channels: 3, background: { r, g, b } } })
    .png()
    .toBuffer();

describe('тёмная ли картинка', () => {
  it('чёрная - тёмная', async () => {
    expect(await isDarkImage(await однотонная(0, 0, 0))).toBe(true);
  });

  it('белая - светлая', async () => {
    expect(await isDarkImage(await однотонная(255, 255, 255))).toBe(false);
  });

  it('насыщенный синий - тёмный: глаз видит его темнее зелёного', async () => {
    expect(await isDarkImage(await однотонная(0, 0, 255))).toBe(true);
  });

  it('светло-зелёный - светлый', async () => {
    expect(await isDarkImage(await однотонная(150, 240, 150))).toBe(false);
  });

  it('не картинка - ответа нет, а не падение', async () => {
    expect(await isDarkImage(Buffer.from('это не картинка'))).toBeNull();
  });
});
