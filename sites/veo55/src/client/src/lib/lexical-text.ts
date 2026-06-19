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
