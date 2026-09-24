import { describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

const { editorHeaders, editorPassFrom } = await import('./editor');
const { CMS_URL } = await import('./cms-url');

describe('заголовки редактора', () => {
  it('пропуск идёт вместе с адресом CMS в origin', () => {
    expect(editorHeaders('payload-token=abc')).toEqual({
      cookie: 'payload-token=abc',
      origin: CMS_URL,
    });
  });

  it('без пропуска - никаких заголовков', () => {
    expect(editorHeaders('')).toEqual({});
  });
});

describe('пропуск редактора', () => {
  it('из всех кук берётся только пропуск CMS', () => {
    expect(editorPassFrom('theme=dark; payload-token=abc.def; _ga=1')).toBe(
      'payload-token=abc.def',
    );
  });

  it('без пропуска - пусто', () => {
    expect(editorPassFrom('theme=dark')).toBe('');
    expect(editorPassFrom('')).toBe('');
  });

  it('похожее имя пропуском не считается', () => {
    expect(editorPassFrom('payload-token-old=1')).toBe('');
  });
});
