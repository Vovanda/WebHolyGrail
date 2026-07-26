/**
 * Минимальный helper для построения Lexical-документа из массива абзацев.
 * Используется в seed-скриптах где не нужно форматирование (жирный/курсив/ссылки).
 */

type LexicalTextNode = {
  type: 'text';
  text: string;
  format: number;
  detail: number;
  mode: 'normal';
  style: '';
  version: 1;
};

type LexicalParagraphNode = {
  type: 'paragraph';
  format: '';
  indent: 0;
  version: 1;
  textFormat: 0;
  children: LexicalTextNode[];
  direction: null;
};

export type LexicalDoc = {
  root: {
    type: 'root';
    format: '';
    indent: 0;
    version: 1;
    direction: null;
    children: LexicalParagraphNode[];
  };
};

function textNode(text: string): LexicalTextNode {
  return { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 };
}

function paragraphNode(text: string): LexicalParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    children: [textNode(text)],
    direction: null,
  };
}

export function paragraphs(...lines: string[]): LexicalDoc {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: null,
      children: lines.map(paragraphNode),
    },
  };
}
