import type { CollectionConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { translitSlug, withAutoSlug } from './slug.js';

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

/** Коллекция-заготовка: поля задаются тестом, остальное неважно. */
const collectionWith = (fields: CollectionConfig['fields']): CollectionConfig => ({
  slug: 'things',
  fields,
});

const TITLE_AND_SLUG = collectionWith([
  { name: 'title', type: 'text' },
  { name: 'slug', type: 'text' },
]);

/**
 * Запускает автозаполнение так, как это делает Payload.
 *
 * @remarks
 * `req.payload.find` подменяем списком занятых slug — хук ходит в базу только
 * ради разведения совпадений, и держать ради этого реальный Payload в юнит-тесте
 * незачем.
 */
const run = async (
  collection: CollectionConfig,
  data: Record<string, unknown>,
  {
    operation = 'create',
    originalDoc,
    taken = [],
  }: {
    operation?: 'create' | 'update';
    originalDoc?: Record<string, unknown>;
    taken?: ReadonlyArray<{ id: string | number; slug: string }>;
  } = {},
): Promise<Record<string, unknown>> => {
  const hook = withAutoSlug(collection).hooks?.beforeValidate?.[0];
  if (!hook) throw new Error('автозаполнение не подключилось');

  const req = { payload: { find: async () => ({ docs: taken }) } };
  const result = await (
    hook as unknown as (args: {
      data: unknown;
      operation: string;
      originalDoc?: unknown;
      req: unknown;
    }) => Promise<Record<string, unknown>>
  )({ data, operation, originalDoc, req });
  return result;
};

describe('withAutoSlug', () => {
  it('заполняет пустой slug из заголовка', async () => {
    expect((await run(TITLE_AND_SLUG, { title: 'Кто я такой?' }))['slug']).toBe('kto-ya-takoy');
  });

  it('не трогает slug, введённый руками', async () => {
    const data = { title: 'Кто я такой?', slug: 'about-me' };
    expect((await run(TITLE_AND_SLUG, data))['slug']).toBe('about-me');
  });

  it('не меняет адрес сохранённого документа при правке заголовка', async () => {
    const result = await run(
      TITLE_AND_SLUG,
      { title: 'Новый заголовок' },
      { operation: 'update', originalDoc: { id: 1, slug: 'staryy-slug' } },
    );
    expect(result['slug']).toBe('staryy-slug');
  });

  it('дозаполняет slug черновику, созданному автосохранением до заголовка', async () => {
    // Ровно тот случай, из-за которого автогенерация не работала: документ уже
    // существует (autosave успел его создать пустым), заголовок появился только
    // сейчас, операция — update.
    const result = await run(
      TITLE_AND_SLUG,
      { title: 'Ремонт на Ленина' },
      { operation: 'update', originalDoc: { id: 7, slug: '' } },
    );
    expect(result['slug']).toBe('remont-na-lenina');
  });

  it('разводит совпадающие заголовки суффиксом', async () => {
    const result = await run(
      TITLE_AND_SLUG,
      { title: 'Ремонт на Ленина' },
      { taken: [{ id: 1, slug: 'remont-na-lenina' }] },
    );
    expect(result['slug']).toBe('remont-na-lenina-2');
  });

  it('не считает занятым собственный slug документа', async () => {
    const result = await run(
      TITLE_AND_SLUG,
      { title: 'Ремонт на Ленина' },
      {
        operation: 'update',
        originalDoc: { id: 1, slug: '' },
        taken: [{ id: 1, slug: 'remont-na-lenina' }],
      },
    );
    expect(result['slug']).toBe('remont-na-lenina');
  });

  it('пустой заголовок оставляет slug пустым', async () => {
    expect((await run(TITLE_AND_SLUG, { title: '' }))['slug']).toBeUndefined();
  });

  it('заголовок без букв и цифр оставляет slug человеку', async () => {
    expect((await run(TITLE_AND_SLUG, { title: '🏗️🚧' }))['slug']).toBeUndefined();
  });

  it('находит заголовок внутри row', async () => {
    const collection = collectionWith([
      { type: 'row', fields: [{ name: 'title', type: 'text' }] },
      { name: 'slug', type: 'text' },
    ]);
    expect((await run(collection, { title: 'Название группы' }))['slug']).toBe('nazvanie-gruppy');
  });

  it('берёт label, когда заголовок называется так', async () => {
    const collection = collectionWith([
      { name: 'label', type: 'text' },
      { name: 'slug', type: 'text' },
    ]);
    expect((await run(collection, { label: 'Фундамент' }))['slug']).toBe('fundament');
  });

  it('уважает порядок источников из custom.slugFrom', async () => {
    const collection: CollectionConfig = {
      slug: 'people',
      custom: { slugFrom: ['nickname', 'fullName'] },
      fields: [
        { name: 'fullName', type: 'text' },
        { name: 'nickname', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
    };
    const data = { fullName: 'Иван Петров', nickname: 'Мастер Ваня' };
    expect((await run(collection, data))['slug']).toBe('master-vanya');
  });

  it('не подключается к коллекции без slug', () => {
    const collection = collectionWith([{ name: 'title', type: 'text' }]);
    expect(withAutoSlug(collection).hooks?.beforeValidate).toBeUndefined();
  });

  it('не подключается, когда выключено через custom.autoSlug', () => {
    const collection: CollectionConfig = {
      slug: 'products',
      custom: { autoSlug: false },
      fields: [
        { name: 'title', type: 'text' },
        { name: 'slug', type: 'text' },
      ],
    };
    expect(withAutoSlug(collection).hooks?.beforeValidate).toBeUndefined();
  });

  it('сохраняет собственные beforeValidate-хуки коллекции', () => {
    const own = ({ data }: { data?: Record<string, unknown> }) => data;
    const collection: CollectionConfig = {
      ...TITLE_AND_SLUG,
      hooks: { beforeValidate: [own] },
    };
    expect(withAutoSlug(collection).hooks?.beforeValidate).toHaveLength(2);
  });
});
