import { describe, expect, it } from 'vitest';

import {
  PREVIEW_DRAFT_TTL_MS,
  createPreviewDraftStore,
  isPreviewCollection,
  readPreviewDraftRequest,
  withPreviewDraft,
} from './preview-draft';

describe('черновик предпросмотра', () => {
  const clock = () => {
    let at = 0;
    return { now: () => at, pass: (ms: number) => (at += ms) };
  };

  it('отдаёт черновик того же раздела и номера', () => {
    const store = createPreviewDraftStore();
    store.put('pass-a', 'articles', 1, { id: 1, title: 'правка' });
    expect(store.get('pass-a', 'articles', '1')).toEqual({ id: 1, title: 'правка' });
    expect(store.get('pass-a', 'articles', 2)).toBeNull();
    expect(store.get('pass-a', 'pages', 1)).toBeNull();
  });

  it('чужой пропуск черновика не видит', () => {
    const store = createPreviewDraftStore();
    store.put('pass-a', 'articles', 1, { id: 1 });
    expect(store.get('pass-b', 'articles', 1)).toBeNull();
  });

  it('на пропуск одна запись - последняя правка', () => {
    const store = createPreviewDraftStore();
    store.put('pass-a', 'articles', 1, { id: 1, v: 1 });
    store.put('pass-a', 'pages', 5, { id: 5 });
    expect(store.get('pass-a', 'articles', 1)).toBeNull();
    expect(store.get('pass-a', 'pages', 5)).toEqual({ id: 5 });
  });

  it('через минуту черновик уходит', () => {
    const time = clock();
    const store = createPreviewDraftStore(time.now);
    store.put('pass-a', 'articles', 1, { id: 1 });
    time.pass(PREVIEW_DRAFT_TTL_MS - 1);
    expect(store.get('pass-a', 'articles', 1)).not.toBeNull();
    time.pass(2);
    expect(store.get('pass-a', 'articles', 1)).toBeNull();
  });

  it('без пропуска - сохранённый документ, с пропуском - черновик того же номера', () => {
    const store = createPreviewDraftStore();
    store.put('pass-a', 'articles', 1, { id: 1, title: 'правка' });
    const saved = { id: 1, title: 'сохранено' };
    expect(withPreviewDraft(saved, '', 'articles', store)).toBe(saved);
    expect(withPreviewDraft(saved, 'pass-a', 'articles', store)).toEqual({
      id: 1,
      title: 'правка',
    });
    expect(withPreviewDraft({ id: 2, title: 'другая' }, 'pass-a', 'articles', store)).toEqual({
      id: 2,
      title: 'другая',
    });
    expect(withPreviewDraft(null, 'pass-a', 'articles', store)).toBeNull();
  });

  it('разделы - только статьи и страницы', () => {
    expect(isPreviewCollection('articles')).toBe(true);
    expect(isPreviewCollection('pages')).toBe(true);
    expect(isPreviewCollection('users')).toBe(false);
  });
});

describe('правка из запроса', () => {
  it('раздел, номер из данных формы и язык', () => {
    expect(
      readPreviewDraftRequest({
        collection: 'articles',
        data: { id: 3, title: 'x' },
        locale: 'ru',
      }),
    ).toEqual({ collection: 'articles', id: 3, data: { id: 3, title: 'x' }, locale: 'ru' });
  });

  it('чужой раздел, данные без номера и мусор - не правка', () => {
    expect(readPreviewDraftRequest({ collection: 'users', data: { id: 1 } })).toBeNull();
    expect(readPreviewDraftRequest({ collection: 'pages', data: { title: 'x' } })).toBeNull();
    expect(readPreviewDraftRequest({ collection: 'pages', data: [1] })).toBeNull();
    expect(readPreviewDraftRequest('текст')).toBeNull();
    expect(readPreviewDraftRequest(null)).toBeNull();
  });
});
