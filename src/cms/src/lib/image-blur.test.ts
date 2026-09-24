import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { makeBlurData } from './image-blur';

describe('размытая заготовка кадра', () => {
  it('из снимка получается мелкая webp-строка в пределах двух килобайт', async () => {
    const photo = await sharp({
      create: { width: 1600, height: 1200, channels: 3, background: { r: 90, g: 120, b: 160 } },
    })
      .jpeg()
      .toBuffer();
    const blur = await makeBlurData(photo);
    expect(blur).toMatch(/^data:image\/webp;base64,/);
    expect(Buffer.from(blur!.split(',')[1]!, 'base64').length).toBeLessThanOrEqual(2048);
    const meta = await sharp(Buffer.from(blur!.split(',')[1]!, 'base64')).metadata();
    expect(meta.width).toBe(64);
  });

  it('мелкий снимок не растягивается', async () => {
    const tiny = await sharp({ create: { width: 20, height: 10, channels: 3, background: '#ccc' } })
      .png()
      .toBuffer();
    const meta = await sharp(
      Buffer.from((await makeBlurData(tiny))!.split(',')[1]!, 'base64'),
    ).metadata();
    expect(meta.width).toBe(20);
  });

  it('не картинка - заготовки нет, а не падение', async () => {
    expect(await makeBlurData(Buffer.from('not an image'))).toBeNull();
  });
});
