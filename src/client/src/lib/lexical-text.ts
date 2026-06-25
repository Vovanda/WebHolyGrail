/**
 * Извлечь plain text из Lexical AST (Payload richText-поле).
 *
 * @remarks
 * **Заглушка на R9.** Когда понадобится полноценный рендер форматирования
 * (жирный, ссылки, заголовки внутри) — заменим на `@payloadcms/richtext-lexical/react`
 * с RichText-компонентом. Сейчас задача проще: вытащить читаемый текст для
 * отображения «как параграф». Этого хватает для описания собаки/помёта.
 *
 * Lexical хранит дерево узлов с типами `paragraph`, `text`, `heading`, `list`,
 * `link` и т.д.; у каждого узла `children`. Текстовые узлы (`type: 'text'`)
 * содержат `text: string`. Параграфы и заголовки разделяем переводом строки.
 */
export function lexicalToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (value as any).root;
  if (!root || !Array.isArray(root.children)) return '';
  return walkBlocks(root.children).trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkBlocks(nodes: any[]): string {
  return nodes
    .map((node) => {
      if (!node) return '';
      if (node.type === 'text' && typeof node.text === 'string') return node.text;
      if (Array.isArray(node.children)) {
        const inner = walkInline(node.children);
        // Блочные узлы (paragraph, heading, list, listitem) разделяем переводом.
        const blockTypes = new Set(['paragraph', 'heading', 'list', 'listitem', 'quote']);
        return blockTypes.has(node.type) ? `${inner}\n\n` : inner;
      }
      return '';
    })
    .join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkInline(nodes: any[]): string {
  return nodes
    .map((node) => {
      if (!node) return '';
      if (node.type === 'text' && typeof node.text === 'string') return node.text;
      if (Array.isArray(node.children)) return walkInline(node.children);
      return '';
    })
    .join('');
}

/** Абзацы (после `\n\n`-разбивки) для удобного `.map()`-рендера. */
export function lexicalToParagraphs(value: unknown): readonly string[] {
  const text = lexicalToPlainText(value);
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Рендер Lexical AST в массив React-узлов с сохранением **inline** форматирования
 * (жирный / курсив / подчёркнутый). Блочные узлы (paragraph / heading / quote / list)
 * разделяются `<br/>` — компактный inline-вывод для коротких описаний (плашки,
 * подписи). Не для длинного контента — там нужен полноценный `<RichText>` от
 * Payload (`@payloadcms/richtext-lexical/react`).
 *
 * Lexical text-node `format` — битовая маска:
 *   bit 0 = bold, bit 1 = italic, bit 2 = strikethrough, bit 3 = underline,
 *   bit 4 = code, bit 5 = subscript, bit 6 = superscript.
 *
 * Функция использует `createElement` (не JSX) чтобы оставаться в `.ts`-файле
 * без переименования в `.tsx`.
 */
import { createElement, type ReactNode } from 'react';

export function lexicalToInlineNodes(value: unknown): ReactNode[] {
  if (!value || typeof value !== 'object') return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = (value as any).root;
  if (!root || !Array.isArray(root.children)) return [];
  const out: ReactNode[] = [];
  const blockTypes = new Set(['paragraph', 'heading', 'list', 'listitem', 'quote']);
  let nodeKey = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (nodes: any[]): void => {
    nodes.forEach((node) => {
      if (!node) return;
      if (node.type === 'text' && typeof node.text === 'string') {
        out.push(
          formatText(node.text, typeof node.format === 'number' ? node.format : 0, nodeKey++),
        );
        return;
      }
      if (Array.isArray(node.children)) {
        walk(node.children);
        if (blockTypes.has(node.type)) out.push(createElement('br', { key: `br-${nodeKey++}` }));
      }
    });
  };
  walk(root.children);
  // Убираем хвостовой <br/> — после последнего параграфа лишний.
  while (out.length > 0) {
    const last = out[out.length - 1];
    if (
      typeof last === 'object' &&
      last !== null &&
      'type' in (last as object) &&
      (last as { type: unknown }).type === 'br'
    ) {
      out.pop();
    } else break;
  }
  return out;
}

function formatText(text: string, format: number, key: number): ReactNode {
  const isBold = (format & 1) !== 0;
  const isItalic = (format & 2) !== 0;
  const isUnderline = (format & 8) !== 0;
  let node: ReactNode = text;
  if (isUnderline) node = createElement('u', { key: `u-${key}` }, node);
  if (isItalic) node = createElement('em', { key: `i-${key}` }, node);
  if (isBold) node = createElement('strong', { key: `b-${key}` }, node);
  if (!isBold && !isItalic && !isUnderline) node = createElement('span', { key: `t-${key}` }, text);
  return node;
}
