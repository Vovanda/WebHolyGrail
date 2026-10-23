import { describe, expect, it } from 'vitest';

import { hasLexicalContent } from './LexicalRenderer';

const doc = (...children: unknown[]) => ({ root: { type: 'root', children } });
const p = (...children: unknown[]) => ({ type: 'paragraph', children });

describe('есть ли что показать в тексте редактора', () => {
  it('очищенное поле - корень с пустым абзацем - пустое', () => {
    expect(hasLexicalContent(doc(p()))).toBe(false);
    expect(hasLexicalContent(doc(p({ type: 'text', text: '   ' }), p({ type: 'linebreak' })))).toBe(
      false,
    );
    expect(hasLexicalContent(null)).toBe(false);
  });

  it('текст или вставка - не пустое', () => {
    expect(hasLexicalContent(doc(p({ type: 'text', text: 'Курс' })))).toBe(true);
    expect(hasLexicalContent(doc({ type: 'upload', value: {} }))).toBe(true);
  });
});
