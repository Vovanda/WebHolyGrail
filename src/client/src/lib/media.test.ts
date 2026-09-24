import type { MediaDoc } from 'contracts';
import { describe, expect, it } from 'vitest';

import {
  mediaFallbackUrl,
  mediaFrame,
  mediaRenditions,
  mediaSmallestUrl,
  mediaSrcSet,
  mediaUpTo,
  widthsUpTo,
  singleFrameAspect,
} from './media';

const doc = (sizes: MediaDoc['sizes']): MediaDoc =>
  ({
    id: '39',
    url: 'https://site.ru/media/IMG_2198.webp?v=1',
    alt: 'Чистое помещение',
    width: 5712,
    height: 4284,
    sizes,
  }) as MediaDoc;

describe('варианты картинки', () => {
  it('идут от мелкого к крупному', () => {
    const got = mediaRenditions(
      doc({
        hero: { url: 'https://site.ru/media/IMG-1920x1440.webp', width: 1920, height: 1440 },
        thumbnail: { url: 'https://site.ru/media/IMG-400x300.webp', width: 400, height: 300 },
        card: { url: 'https://site.ru/media/IMG-768x576.webp', width: 768, height: 576 },
      }),
    );

    expect(got.map((r) => r.width)).toEqual([400, 768, 1920]);
  });

  it('оригинал в перечень не попадает', () => {
    const got = mediaRenditions(
      doc({ card: { url: 'https://site.ru/media/IMG-768x576.webp', width: 768, height: 576 } }),
    );

    expect(got).toHaveLength(1);
    expect(got[0]?.width).toBe(768);
  });

  it('незаполненный вариант отбрасывается', () => {
    const got = mediaRenditions(
      doc({
        card: { url: 'https://site.ru/media/IMG-768x576.webp', width: 768, height: 576 },
        hero: { url: '', width: 0, height: 0 },
      } as unknown as MediaDoc['sizes']),
    );

    expect(got.map((r) => r.width)).toEqual([768]);
  });

  it('относительный адрес доводится до полного', () => {
    const got = mediaRenditions(
      doc({ card: { url: '/media/IMG-768x576.webp', width: 768, height: 576 } }),
    );

    expect(got[0]?.url).toMatch(/^https?:\/\/.+\/media\/IMG-768x576\.webp$/);
  });

  it('голый номер вместо документа даёт пустой перечень', () => {
    expect(mediaRenditions('39')).toEqual([]);
    expect(mediaRenditions(null)).toEqual([]);
  });
});

describe('перечень для браузера', () => {
  it('собирается с шириной каждого варианта', () => {
    const got = mediaSrcSet([
      { url: 'https://site.ru/a-400.webp', width: 400 },
      { url: 'https://site.ru/a-768.webp', width: 768 },
    ]);

    expect(got).toBe('https://site.ru/a-400.webp 400w, https://site.ru/a-768.webp 768w');
  });

  it('без вариантов не собирается вовсе', () => {
    expect(mediaSrcSet([])).toBeUndefined();
  });
});

describe('запасной адрес', () => {
  it('самый крупный вариант, когда они есть', () => {
    const renditions = [
      { url: 'https://site.ru/a-400.webp', width: 400 },
      { url: 'https://site.ru/a-1920.webp', width: 1920 },
    ];

    expect(mediaFallbackUrl(doc({}), renditions)).toBe('https://site.ru/a-1920.webp');
  });

  it('сам файл, когда вариантов нет', () => {
    expect(mediaFallbackUrl(doc({}), [])).toBe('https://site.ru/media/IMG_2198.webp?v=1');
  });
});

describe('служебный адрес', () => {
  it('мельчайший вариант, когда они есть', () => {
    expect(
      mediaSmallestUrl({
        id: 1,
        url: '/media/photo.jpg',
        sizes: {
          card: { url: 'https://cdn.example/card.jpg', width: 768, height: 576 },
          thumbnail: { url: 'https://cdn.example/thumb.jpg', width: 400, height: 300 },
        },
      }),
    ).toBe('https://cdn.example/thumb.jpg');
  });

  it('сам файл, когда вариантов нет', () => {
    expect(mediaSmallestUrl({ id: 1, url: 'https://cdn.example/photo.jpg' })).toBe(
      'https://cdn.example/photo.jpg',
    );
  });

  it('голый номер вместо документа адреса не даёт', () => {
    expect(mediaSmallestUrl('7')).toBeNull();
  });
});

describe('предел ступени', () => {
  const set = [
    { url: 'a-400.webp', width: 400 },
    { url: 'a-768.webp', width: 768 },
    { url: 'a-1200.webp', width: 1200 },
  ];

  it('оставляет то, что не крупнее выбранного', () => {
    expect(mediaUpTo(set, 'card').map((one) => one.width)).toEqual([400, 768]);
  });

  it('без выбора набор идёт целиком', () => {
    expect(mediaUpTo(set, null)).toHaveLength(3);
  });

  it('незнакомое имя ступени ничего не меняет', () => {
    expect(mediaUpTo(set, 'huge' as never)).toHaveLength(3);
  });

  it('когда всё крупнее предела, остаётся мельчайший', () => {
    expect(mediaUpTo(set.slice(2), 'thumbnail').map((one) => one.width)).toEqual([1200]);
  });
});

describe('форма одиночного кадра', () => {
  const sized = (width: number, height: number) =>
    ({ id: '1', url: '/m.webp', width, height }) as MediaDoc;

  it('лежачий идёт 16:9', () => {
    expect(singleFrameAspect(sized(1920, 874))).toEqual({ width: 16, height: 9 });
  });

  it('стоячий идёт 9:16', () => {
    expect(singleFrameAspect(sized(874, 1920))).toEqual({ width: 9, height: 16 });
  });

  it('квадрат идёт лёжа', () => {
    expect(singleFrameAspect(sized(1000, 1000))).toEqual({ width: 16, height: 9 });
  });

  it('без размеров и без документа формы нет', () => {
    expect(singleFrameAspect(sized(0, 0))).toBeUndefined();
    expect(singleFrameAspect('12')).toBeUndefined();
    expect(singleFrameAspect(null)).toBeUndefined();
  });
});

describe('предел по ширине', () => {
  const set = [{ width: 400 }, { width: 768 }, { width: 1200 }];

  it('без предела набор идёт целиком', () => {
    expect(widthsUpTo(set, null)).toHaveLength(3);
  });

  it('всё шире предела уходит', () => {
    expect(widthsUpTo(set, 800).map((one) => one.width)).toEqual([400, 768]);
  });

  it('если шире все, остаётся мельчайший', () => {
    expect(widthsUpTo(set, 100)).toEqual([{ width: 400 }]);
  });
});

describe('заготовка кадра', () => {
  it('без заготовки строкой размывается наименьшая копия', () => {
    const old = doc({
      thumbnail: { url: 'https://site.ru/media/OLD-400x300.webp', width: 400, height: 300 },
      hero: { url: 'https://site.ru/media/OLD-1920x1440.webp', width: 1920, height: 1440 },
    });
    expect(mediaFrame(old)?.blur).toBe('https://site.ru/media/OLD-400x300.webp');
  });

  it('у файла без копий размывать нечего', () => {
    const bare = {
      id: '9',
      url: 'https://site.ru/media/ONLY.webp',
      width: 800,
      height: 600,
    } as MediaDoc;
    expect(mediaFrame(bare)?.blur).toBeNull();
  });
});

describe('кадр для показа', () => {
  const photo = {
    ...doc({
      thumbnail: { url: 'https://site.ru/media/IMG-400x300.webp', width: 400, height: 300 },
      hero: { url: 'https://site.ru/media/IMG-1920x1440.webp', width: 1920, height: 1440 },
    }),
    blurData: 'data:image/webp;base64,AAAA',
    focalX: 30,
    focalY: 70,
  } as MediaDoc;

  it('без адреса кадра нет', () => {
    expect(mediaFrame({ id: '1' } as MediaDoc)).toBeNull();
    expect(mediaFrame(null)).toBeNull();
  });

  it('лента без предела получает и сам файл', () => {
    const got = mediaFrame(photo);
    expect(got?.laneSet).toContain('IMG_2198.webp?v=1 5712w');
    expect(got?.srcSet).not.toContain('5712w');
  });

  it('предел страницы сужает поток, но не ленту', () => {
    const got = mediaFrame({ ...photo, pageStep: 'thumbnail' } as MediaDoc);
    expect(got?.srcSet).toBe('https://site.ru/media/IMG-400x300.webp 400w');
    expect(got?.laneSet).toContain('1920w');
  });

  it('предел ленты убирает из неё сам файл', () => {
    const got = mediaFrame({ ...photo, laneStep: 'thumbnail' } as MediaDoc);
    expect(got?.laneSet).toBe('https://site.ru/media/IMG-400x300.webp 400w');
  });

  it('точка подрезки и заготовка берутся у файла', () => {
    expect(mediaFrame(photo)).toMatchObject({ focus: '30% 70%', blur: photo.blurData });
  });

  it('форма места главнее формы снимка', () => {
    expect(mediaFrame(photo)?.shape).toEqual({ width: 5712, height: 4284 });
    expect(mediaFrame(photo, { width: 16, height: 9 })?.shape).toEqual({ width: 16, height: 9 });
  });
});
