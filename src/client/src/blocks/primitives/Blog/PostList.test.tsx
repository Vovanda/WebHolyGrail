import { renderToStaticMarkup } from 'react-dom/server';
import type { BlogArticle, BlogGlobalSettings } from 'contracts';
import { describe, expect, it } from 'vitest';

import { PostList } from './PostList';

/**
 * Лента блога рендерится на сервере, поэтому проверяем разметку строкой —
 * jsdom для этого не нужен.
 */

const globalBlog: BlogGlobalSettings = {
  showAuthor: true,
  showDate: true,
  showReadingTime: true,
  showTags: false,
  postsPerPage: 10,
  defaultSort: 'newest',
};

function article(overrides: Partial<BlogArticle> = {}): BlogArticle {
  return {
    id: overrides.id ?? 1,
    slug: overrides.slug ?? 'test-do-not-use',
    title: overrides.title ?? 'Заголовок записи',
    lead: overrides.lead ?? 'Лид записи.',
    body: null,
    status: 'published',
    publishedAt: '2026-05-02T10:00:00.000Z',
    readingTime: 4,
    author: { id: 1, slug: 'author', name: 'Автор Тестовый' },
    createdAt: '2026-05-02T10:00:00.000Z',
    updatedAt: '2026-05-02T10:00:00.000Z',
    ...overrides,
  };
}

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

describe('PostList', () => {
  it('по умолчанию отдаёт ленту с разделителями', () => {
    const html = render(
      <PostList
        articles={[article({ id: 1 }), article({ id: 2 }), article({ id: 3 })]}
        globalBlog={globalBlog}
      />,
    );

    // Разделитель есть между записями, но не над первой: 3 записи → 2 линии.
    expect(html.split('border-t border-border').length - 1).toBe(2);
  });

  it('первая запись становится крупной, когда включён featured', () => {
    const html = render(
      <PostList
        articles={[article({ id: 1, title: 'Крупная' }), article({ id: 2, title: 'Обычная' })]}
        globalBlog={globalBlog}
        featured
      />,
    );

    expect(html).toContain('<h1');
    expect(html).toContain('Крупная');
    expect(html).toContain('Обычная');
  });

  it('в ленте показывает превью только у записей с обложкой', () => {
    const withCover = article({ id: 1, cover: { id: 10, url: '/cover.jpg', alt: 'Обложка' } });
    const html = render(
      <PostList articles={[withCover, article({ id: 2 })]} globalBlog={globalBlog} />,
    );

    expect(html.split('<img').length - 1).toBe(1);
    expect(html).toContain('/cover.jpg');
  });

  it('разделяет мету тире', () => {
    const html = render(<PostList articles={[article()]} globalBlog={globalBlog} />);

    expect(html).toContain('Автор Тестовый');
    expect(html).toContain('—');
  });

  it('на пустом списке сообщает об этом вместо разделителей', () => {
    const html = render(<PostList articles={[]} globalBlog={globalBlog} />);

    expect(html).toContain('Пока статей нет.');
    expect(html).not.toContain('border-t');
  });

  it('вариант grid остаётся плиточным', () => {
    const html = render(
      <PostList articles={[article({ id: 1 })]} globalBlog={globalBlog} variant="grid" />,
    );

    // плитки раскладываются рядами: доля ряда у карточки и никаких разделителей
    expect(html).toContain('--card-columns');
    expect(html).not.toContain('border-t border-border');
  });
});
