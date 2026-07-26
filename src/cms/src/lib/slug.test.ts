import { describe, expect, it } from 'vitest';

import { slugFrom, translitSlug } from './slug.js';

describe('translitSlug', () => {
  it('транслитерирует кириллицу', () => {
    expect(translitSlug('Кто я такой?')).toBe('kto-ya-takoy');
  });

  it('схлопывает пунктуацию и пробелы в один дефис', () => {
    expect(translitSlug('Квантование: всё, что вам нужно')).toBe('kvantovanie-vse-chto-vam-nuzhno');
  });

  it('не оставляет дефисы по краям', () => {
    expect(translitSlug('  — Привет! — ')).toBe('privet');
  });

  it('латиницу и цифры оставляет как есть', () => {
    expect(translitSlug('Next 15 + Payload 3')).toBe('next-15-payload-3');
  });

  it('режет длинный заголовок по границе слова', () => {
    const slug = translitSlug('а'.repeat(50) + ' ' + 'б'.repeat(50));
    expect(slug).toBe('a'.repeat(50));
  });

  it('пустую строку отдаёт пустой', () => {
    expect(translitSlug('   ')).toBe('');
  });
});

describe('slugFrom', () => {
  const hook = slugFrom('title');
  const run = (
    data: Record<string, unknown>,
    operation: 'create' | 'update' = 'create',
    originalDoc?: Record<string, unknown>,
  ) =>
    (
      hook as (args: {
        data: unknown;
        operation: string;
        originalDoc?: unknown;
      }) => Record<string, unknown>
    )({ data, operation, originalDoc });

  it('заполняет пустой slug из заголовка', () => {
    expect(run({ title: 'Кто я такой?' })['slug']).toBe('kto-ya-takoy');
  });

  it('не трогает slug, введённый руками', () => {
    expect(run({ title: 'Кто я такой?', slug: 'about-me' })['slug']).toBe('about-me');
  });

  it('не меняет slug сохранённого документа при правке заголовка', () => {
    expect(run({ title: 'Новый заголовок' }, 'update', { slug: 'staryy-slug' })['slug']).toBe(
      undefined,
    );
  });

  it('пустой slug существующей страницы (главная) остаётся пустым', () => {
    expect(run({ title: 'Главная', slug: '' }, 'update', { slug: '' })['slug']).toBe('');
  });

  it('пустой заголовок оставляет slug пустым', () => {
    expect(run({ title: '' })['slug']).toBeUndefined();
  });
});
