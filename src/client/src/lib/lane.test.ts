import { describe, expect, it } from 'vitest';

import {
  LANE_ZOOM,
  LANE_ZOOM_LIMIT,
  fileButtonLabel,
  laneFrame,
  laneSources,
  laneZoomRatio,
  parseRenditions,
} from './lane';

/** Монитор и телефон: на них полотно ведёт себя по-разному. */
const desktop = { width: 1920, height: 1080 };
const phone = { width: 390, height: 844 };

describe('полотно показа', () => {
  it('одно на все снимки - от формы кадра не зависит', () => {
    const got = laneFrame({ viewport: desktop });
    expect(got.width).toBeGreaterThan(0);
    expect(got.height).toBeGreaterThan(0);
  });

  it('высотой берёт долю экрана, оставляя поле сверху и снизу', () => {
    const got = laneFrame({ viewport: desktop });
    expect(got.height).toBeLessThanOrEqual(Math.round(desktop.height * 0.8));
    expect(got.height).toBeGreaterThan(desktop.height * 0.6);
  });

  it('на узком экране занимает его целиком - полям места нет', () => {
    const got = laneFrame({ viewport: phone });
    expect(got.width).toBe(phone.width);
    expect(got.left).toBe(0);
  });

  it('края равны между собой и сходятся с шириной экрана', () => {
    const got = laneFrame({ viewport: desktop });
    expect(got.left).toBe(got.right);
    expect(Math.abs(got.left * 2 + got.width - desktop.width)).toBeLessThanOrEqual(1);
  });

  it('низ считается от высоты полотна - к нему прижата подпись', () => {
    const got = laneFrame({ viewport: desktop });
    expect(got.bottom).toBe(Math.round((desktop.height + got.height) / 2));
  });

  it('при приближении полотном служит сам экран', () => {
    const got = laneFrame({ viewport: desktop, zoomed: true });
    expect(got).toEqual({
      width: 1920,
      height: 1080,
      left: 0,
      right: 0,
      bottom: 1080,
    });
  });
});

describe('полотно на разных экранах', () => {
  it('на телефоне стоймя занимает экран целиком - полям места нет', () => {
    const s24 = { width: 360, height: 780 };
    const got = laneFrame({ viewport: s24 });
    expect(got).toMatchObject({ width: 360, height: 780, left: 0, right: 0 });
  });

  it('на планшете стоймя тоже занимает экран целиком', () => {
    const got = laneFrame({ viewport: { width: 820, height: 1180 } });
    expect(got.left).toBe(0);
    expect(got.width).toBe(820);
  });

  it('на планшете лёжа поля возвращаются - ширины хватает', () => {
    const got = laneFrame({ viewport: { width: 1180, height: 820 } });
    expect(got.left).toBeGreaterThan(0);
    expect(got.width).toBeLessThan(1180);
  });

  it('на мониторе поля есть', () => {
    const got = laneFrame({ viewport: { width: 1920, height: 1080 } });
    expect(got.left).toBeGreaterThan(0);
  });
});

describe('набор вариантов из разметки', () => {
  it('разбирается от мелкого к крупному, испорченные куски отброшены', () => {
    expect(parseRenditions('/b.webp 1200w, мусор, /a.webp 400w, /c.webp 0w')).toEqual([
      { url: '/a.webp', width: 400 },
      { url: '/b.webp', width: 1200 },
    ]);
  });

  it('пустая строка даёт пустой набор', () => {
    expect(parseRenditions('')).toEqual([]);
  });
});

describe('варианты для ленты', () => {
  const set = [
    { url: '/a.webp', width: 400 },
    { url: '/b.webp', width: 1200 },
  ];

  it('высота идёт по пропорции кадра', () => {
    expect(laneSources(set, { width: 1600, height: 900 })).toEqual([
      { src: '/a.webp', width: 400, height: 225 },
      { src: '/b.webp', width: 1200, height: 675 },
    ]);
  });

  it('стоячий кадр выше своей ширины', () => {
    expect(laneSources(set, { width: 900, height: 1600 })[0]).toEqual({
      src: '/a.webp',
      width: 400,
      height: 711,
    });
  });

  it('без размеров кадра вариант считается квадратным', () => {
    expect(laneSources(set, { width: 0, height: 0 })[1]?.height).toBe(1200);
  });
});

describe('кнопка самого крупного файла', () => {
  it('подписана разрешением файла', () => {
    expect(fileButtonLabel(5712, 4284)).toBe('5712 × 4284');
  });

  it('без размеров - словом', () => {
    expect(fileButtonLabel(0, 0)).toBe('Файл');
  });
});

describe('ступени приближения', () => {
  const limit = (
    viewport: { width: number; height: number },
    file: { width: number; height: number },
  ) => {
    // Предел так, как его считает лента: файл на число, делённый на показанную ширину.
    const shown = Math.min(
      viewport.width,
      (viewport.height / file.height) * file.width,
      file.width,
    );
    return (file.width * laneZoomRatio({ viewport, file })) / shown;
  };
  const top = LANE_ZOOM_LIMIT;

  it('крупный файл, мелкий файл и стоячий кадр упираются в один предел', () => {
    const viewport = { width: 1440, height: 900 };
    for (const file of [
      { width: 5712, height: 4284 },
      { width: 640, height: 480 },
      { width: 1080, height: 1920 },
    ]) {
      expect(limit(viewport, file)).toBeCloseTo(top, 6);
    }
  });

  it('на телефоне предел тот же', () => {
    expect(limit({ width: 390, height: 844 }, { width: 4000, height: 3000 })).toBeCloseTo(top, 6);
  });

  it('последнее нажатие упирается в предел, а до него все ступени целые', () => {
    const before = LANE_ZOOM.multiplier ** (LANE_ZOOM.steps - 1);
    expect(LANE_ZOOM_LIMIT).toBeGreaterThan(before);
    expect(LANE_ZOOM_LIMIT).toBeLessThan(LANE_ZOOM.multiplier ** LANE_ZOOM.steps);
  });

  it('без размеров файла - единица', () => {
    expect(
      laneZoomRatio({ viewport: { width: 1440, height: 900 }, file: { width: 0, height: 0 } }),
    ).toBe(1);
  });
});
