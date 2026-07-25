import { describe, expect, it } from 'vitest';

import { showLead } from './page';

/** Lexical-дерево из абзацев — минимум, который читает lexicalToPlainText. */
function body(...paragraphs: string[]): unknown {
  return {
    root: {
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        children: [{ type: 'text', text }],
      })),
    },
  };
}

describe('showLead', () => {
  it('прячет лид, скопированный из первого абзаца', () => {
    const first = 'Я человек и пароход с 8-летним стажем в корпоративном .NET.';
    expect(showLead(first, body(first, 'Второй абзац.'))).toBe(false);
  });

  it('прячет лид, обрезанный многоточием', () => {
    const first = 'Это не статья. Это попытка описать собственный способ думать — изнутри.';
    expect(showLead('Это не статья. Это попытка описать…', body(first))).toBe(false);
  });

  it('не считает совпадением разную пунктуацию в середине', () => {
    expect(showLead('Совсем другой текст лида.', body('Первый абзац записи.'))).toBe(true);
  });

  it('показывает осмысленный лид', () => {
    expect(showLead('Коротко: зачем всё это.', body('Начнём издалека.'))).toBe(true);
  });

  it('пустой лид не показывает', () => {
    expect(showLead(undefined, body('Текст.'))).toBe(false);
    expect(showLead('   ', body('Текст.'))).toBe(false);
  });

  it('переносы и двойные пробелы не мешают сравнению', () => {
    expect(showLead('Первый  абзац записи.', body('Первый абзац\nзаписи.'))).toBe(false);
  });
});
