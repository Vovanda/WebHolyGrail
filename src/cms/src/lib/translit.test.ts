import { describe, expect, it } from 'vitest';

import { latinFilename, translitSlug } from './translit.js';

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

describe('имя залитого файла', () => {
  it('кириллица и пробелы уходят в латиницу через дефис', () => {
    expect(latinFilename('монтаж вентеляции.webp')).toBe('montazh-ventelyacii.webp');
  });

  it('расширение остаётся, но в нижнем регистре', () => {
    expect(latinFilename('Отчёт.PDF')).toBe('otchet.pdf');
  });

  it('латинское имя не меняется без нужды', () => {
    expect(latinFilename('hero-banner.jpg')).toBe('hero-banner.jpg');
  });

  it('имя из одних знаков заменяется словом', () => {
    expect(latinFilename('!!!.png')).toBe('file.png');
  });

  it('файл без расширения тоже приводится', () => {
    expect(latinFilename('Смета на объект')).toBe('smeta-na-obekt');
  });

  it('точка в начале не считается расширением', () => {
    expect(latinFilename('.gitkeep')).toBe('gitkeep');
  });
});
