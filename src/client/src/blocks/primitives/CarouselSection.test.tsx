import { describe, expect, it, vi } from 'vitest';

/**
 * Проверяем сбор карточек: заведённые руками, взятые из записей блога и с
 * канала. Сама вёрстка ленты проверена в тестах примитива.
 */

vi.mock('@/lib/api-client', () => ({
  listArticles: vi.fn(async () => ({
    docs: [
      { id: 1, slug: 'first', title: 'Первая запись', lead: 'Коротко о чём', cover: null },
      { id: 2, slug: 'second', title: 'Вторая запись', cover: null },
    ],
    totalDocs: 2,
    page: 1,
    totalPages: 1,
  })),
  getChannel: vi.fn(async () => ({
    channel: 'whg',
    authorName: 'Автор',
    videos: [
      {
        code: 'aaa1111',
        title: 'Первое видео',
        poster: '/p1.jpg',
        durationSeconds: 17,
        createdAt: null,
      },
      {
        code: 'bbb2222',
        title: 'Второе видео',
        poster: null,
        durationSeconds: 20,
        createdAt: null,
      },
    ],
  })),
}));

const { CarouselSection, fromEditor } = await import('./CarouselSection');
const { listArticles, getChannel } = await import('@/lib/api-client');

function node(data: Record<string, unknown>) {
  return { blockType: 'carousel', id: 'c1', data } as never;
}

const settings = {} as never;

async function cardsOf(data: Record<string, unknown>) {
  const rendered = (await CarouselSection({ node: node(data), settings })) as {
    props?: { children?: unknown };
  } | null;
  return rendered;
}

describe('CarouselSection', () => {
  it('без карточек и без источника лента не рисуется', async () => {
    expect(await cardsOf({})).toBeNull();
  });

  it('карточки, заведённые руками, показываются как есть', async () => {
    const rendered = await cardsOf({ cards: [{ title: 'Своя карточка' }] });
    expect(rendered).not.toBeNull();
  });

  it('источник «записи блога» спрашивает их у коллекции', async () => {
    await cardsOf({ sourceKind: 'articles', sourceLimit: 5 });
    expect(listArticles).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  it('источник «видео канала» спрашивает канал по имени', async () => {
    await cardsOf({ sourceKind: 'videos', sourceChannel: 'whg' });
    expect(getChannel).toHaveBeenCalledWith('whg');
  });

  it('видео без указанного канала лента не показывает', async () => {
    expect(await cardsOf({ sourceKind: 'videos' })).toBeNull();
  });
});

/**
 * Карточка из админки приходит плоской: документ медиатеки в `image`, ссылка
 * строками. Лента ждёт `image.media` и объект `link` - без сборки карточка
 * рисовалась без кадра и без ссылки.
 */
describe('fromEditor', () => {
  it('документ медиатеки становится картинкой карточки', () => {
    const media = { id: 95, url: '/media/shot.webp', width: 1440, height: 900 };
    const card = fromEditor({
      image: media,
      title: 'veo55.ru',
      text: 'Сайт питомника',
    } as never);

    expect(card.image?.media).toMatchObject({ id: 95 });
    expect(card.image?.alt).toBe('veo55.ru');
    expect(card.title).toBe('veo55.ru');
  });

  it('href и подпись ссылки становятся ссылкой карточки', () => {
    const card = fromEditor({
      title: 'veo55.ru',
      href: '/@veo55',
      linkLabel: 'Открыть',
    } as never);

    expect(card.link).toEqual({ href: '/@veo55', label: 'Открыть' });
  });

  it('подпись ссылки без своего текста берётся из заголовка', () => {
    const card = fromEditor({ title: 'Сайт', href: '/site' } as never);
    expect(card.link?.label).toBe('Сайт');
  });

  it('обёртка ImageRef остаётся картинкой карточки', () => {
    const media = { id: 7, url: '/media/a.webp' };
    const card = fromEditor({ image: { media, alt: 'Кадр' } } as never);
    expect(card.image?.media).toMatchObject({ id: 7 });
    expect(card.image?.alt).toBe('Кадр');
  });
});
