import { describe, expect, it } from 'vitest';

import {
  documentsPreview,
  galleryPreview,
  recordingPreview,
  relationKey,
  relationKeys,
  rowValues,
  type MediaCard,
} from './attachment-preview-model';

const photo: MediaCard = {
  id: 7,
  url: '/media/a.webp',
  width: 4000,
  height: 3000,
  sizes: { thumbnail: { url: '/media/a-400.webp' } },
};
const tall: MediaCard = { id: 8, url: '/media/b.webp', width: 900, height: 1600 };
const clip: MediaCard = {
  id: 9,
  url: '/internal/video/manifest/9',
  thumbnailURL: '/media/poster.webp',
  caption: 'Волны о скалы',
  filename: 'hls/9/master.m3u8',
};
const pdf: MediaCard = {
  id: 10,
  filename: 'smeta.pdf',
  filesize: 245 * 1024,
  caption: '',
  mimeType: 'application/pdf',
};

describe('значения полей блока', () => {
  it('связь приходит номером или документом', () => {
    expect(relationKey(7)).toBe('7');
    expect(relationKey({ id: 7 })).toBe('7');
    expect(relationKey(null)).toBeNull();
    expect(relationKey('')).toBeNull();
  });

  it('поле со многими файлами даёт номера по порядку', () => {
    expect(relationKeys([7, { id: 8 }, null])).toEqual(['7', '8']);
    expect(relationKeys(undefined)).toEqual([]);
  });

  it('строки массива читаются по номеру строки, а не по порядку ключей', () => {
    const fields = {
      'items.1.file': { value: 11 },
      'items.0.file': { value: 10 },
      'items.0.title': { value: 'Смета' },
      heading: { value: '' },
    };
    expect(rowValues(fields, 'items', 'file')).toEqual([10, 11]);
    expect(rowValues(fields, 'items', 'title')).toEqual(['Смета']);
  });
});

describe('превью галереи', () => {
  it('кадры мелкой ступенью и формой, как на сайте', () => {
    expect(galleryPreview(['7', '8'], [photo, tall], 'list')).toEqual({
      kind: 'frames',
      layout: 'list',
      frames: [
        { id: '7', src: '/media/a-400.webp', aspect: { width: 16, height: 9 } },
        { id: '8', src: '/media/b.webp', aspect: { width: 9, height: 16 } },
      ],
    });
  });

  it('пока ответа нет - загрузка, а не пустота', () => {
    expect(galleryPreview(['7'], null, 'tiles')).toEqual({ kind: 'loading' });
  });

  it('ответ пришёл без файла - файл удалён из медиатеки', () => {
    expect(galleryPreview(['7'], [], 'tiles')).toEqual({
      kind: 'empty',
      hint: 'Файл не найден в медиатеке',
      action: 'Выбрать другой',
    });
  });

  it('галерея без кадров зовёт выбрать', () => {
    expect(galleryPreview([], [], 'tiles')).toEqual({
      kind: 'empty',
      hint: 'Кадров пока нет',
      action: 'Выбрать кадры',
    });
  });
});

describe('превью видео', () => {
  it('кадр записи и её название', () => {
    expect(recordingPreview('9', [clip], '', undefined)).toEqual({
      kind: 'recording',
      poster: '/media/poster.webp',
      title: 'Волны о скалы',
      wide: false,
    });
  });

  it('подпись в блоке главнее названия записи', () => {
    expect(recordingPreview('9', [clip], 'Прибой', 'content')).toMatchObject({ title: 'Прибой' });
  });

  it('без записи зовёт выбрать', () => {
    expect(recordingPreview(null, [clip], '', 'content')).toEqual({
      kind: 'empty',
      hint: 'Видео не выбрано',
      action: 'Выбрать видео',
    });
  });

  it('запись выбрана, ответа ещё нет - загрузка', () => {
    expect(recordingPreview('9', null, '', 'content')).toEqual({ kind: 'loading' });
  });
});

describe('превью документов', () => {
  it('имя файла и вес', () => {
    expect(documentsPreview(['10'], [], [pdf], 'list')).toEqual({
      kind: 'documents',
      layout: 'list',
      rows: [{ id: '0-10', name: 'smeta.pdf', size: '245 КБ', type: 'PDF', thumb: null }],
    });
  });

  it('своё название строки главнее имени файла', () => {
    expect(documentsPreview(['10'], ['Смета на объект'], [pdf], 'cards')).toMatchObject({
      rows: [{ name: 'Смета на объект' }],
    });
  });

  it('без единого файла зовёт выбрать', () => {
    expect(documentsPreview([null], [], [pdf], 'cards')).toEqual({
      kind: 'empty',
      hint: 'Документов пока нет',
      action: 'Выбрать документы',
    });
    expect(documentsPreview([], [], [], 'cards')).toMatchObject({ kind: 'empty' });
  });

  it('строка без файла пропускается среди заполненных', () => {
    expect(documentsPreview([null, '10'], [], [pdf], 'cards')).toMatchObject({
      rows: [{ name: 'smeta.pdf' }],
    });
  });
});

describe('превью по виду блока', () => {
  it('плиткой кадры идут формой снимка, как ряды сайта', () => {
    const got = galleryPreview(['7', '8'], [photo, tall], 'tiles');
    expect(got).toMatchObject({
      layout: 'tiles',
      frames: [{ aspect: { width: 4000, height: 3000 } }, { aspect: { width: 900, height: 1600 } }],
    });
  });

  it('без вида у блока - плитка, как умолчание поля', () => {
    expect(galleryPreview(['7'], [photo], undefined)).toMatchObject({ layout: 'tiles' });
    expect(galleryPreview(['7'], [photo], 'мусор')).toMatchObject({ layout: 'tiles' });
  });

  it('карусель сохраняет свой вид', () => {
    expect(galleryPreview(['7'], [photo], 'carousel')).toMatchObject({ layout: 'carousel' });
  });

  it('видео во всю ширину отмечено', () => {
    expect(recordingPreview('9', [clip], '', 'wide')).toMatchObject({ wide: true });
  });

  it('документы без вида у блока - плитками, с кадром первой страницы', () => {
    const got = documentsPreview(['10'], [], [{ ...pdf, previewUrl: '/p.webp' }], undefined);
    expect(got).toMatchObject({ layout: 'cards', rows: [{ thumb: '/p.webp', type: 'PDF' }] });
  });
});
