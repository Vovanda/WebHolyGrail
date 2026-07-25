import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * LexicalRenderer — рендер Lexical AST (Payload `richText`) в React.
 *
 * @remarks
 * Generic, не блоговый: тело статьи, длинное «О нас», описание услуги — один
 * компонент (R9). Покрывает узлы, которые даёт дефолтный `lexicalEditor()`:
 * заголовки, абзацы, списки (включая чек-лист), цитаты, код, разделители,
 * ссылки и **загруженные картинки внутри текста**.
 *
 * Незнакомый узел не роняет страницу — рекурсивно рендерятся его дети, а если
 * их нет, узел пропускается. Так новый feature редактора деградирует до текста,
 * а не до пустого экрана.
 *
 * Server-only (R14), клиентского JS не добавляет. Стилизация — токены (R2).
 */
export interface LexicalRendererProps {
  readonly value: unknown;
  readonly className?: string;
}

interface LexNode {
  readonly type: string;
  readonly children?: ReadonlyArray<LexNode>;
  readonly text?: string;
  /** Битовая маска: 1=bold, 2=italic, 4=strikethrough, 8=underline, 16=code, 32=sub, 64=sup. */
  readonly format?: number | string;
  readonly tag?: string;
  readonly listType?: 'bullet' | 'number' | 'check';
  readonly checked?: boolean;
  readonly url?: string;
  readonly newTab?: boolean;
  readonly fields?: {
    readonly url?: string;
    readonly newTab?: boolean;
    readonly linkType?: string;
    readonly doc?: { readonly value?: { readonly slug?: string } | string };
  };
  readonly value?: {
    readonly url?: string;
    readonly alt?: string;
    readonly width?: number;
    readonly height?: number;
    readonly filename?: string;
  };
  readonly relationTo?: string;
  readonly language?: string;
}

export function LexicalRenderer({ value, className }: LexicalRendererProps) {
  const root = (value as { root?: LexNode } | null | undefined)?.root;
  if (!root?.children?.length) return null;

  return (
    <div className={cn('flex flex-col gap-5 text-ink leading-relaxed', className)}>
      {root.children.map((node, index) => renderNode(node, index))}
    </div>
  );
}

function renderNode(node: LexNode, key: number): ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'text':
      return renderText(node, key);

    case 'linebreak':
      return <br key={key} />;

    case 'paragraph': {
      const children = renderChildren(node);
      // Пустой абзац в редакторе — это отступ, а не текст. Схлопываем.
      if (!hasContent(node)) return null;
      return <p key={key}>{children}</p>;
    }

    case 'heading':
      return renderHeading(node, key);

    case 'list':
      return renderList(node, key);

    case 'listitem':
      return (
        <li key={key} className={node.checked !== undefined ? 'list-none' : undefined}>
          {node.checked !== undefined && (
            <input
              type="checkbox"
              checked={node.checked}
              readOnly
              className="mr-2 align-middle accent-accent"
            />
          )}
          {renderChildren(node)}
        </li>
      );

    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-l-2 border-accent pl-4 italic font-display text-ink/90"
        >
          {renderChildren(node)}
        </blockquote>
      );

    case 'code':
      return (
        <pre
          key={key}
          className="bg-surface rounded-md p-4 overflow-x-auto text-sm font-mono text-ink"
        >
          <code>{renderChildren(node)}</code>
        </pre>
      );

    case 'horizontalrule':
    case 'horizontalRule':
      return <hr key={key} className="border-line my-2" />;

    case 'link':
    case 'autolink':
      return renderLink(node, key);

    case 'upload':
      return renderUpload(node, key);

    default:
      // Неизвестный узел — не теряем его содержимое.
      return node.children?.length ? <span key={key}>{renderChildren(node)}</span> : null;
  }
}

function renderChildren(node: LexNode): ReactNode[] {
  return (node.children ?? []).map((child, index) => renderNode(child, index));
}

/** Есть ли в поддереве хоть какой-то видимый контент. */
function hasContent(node: LexNode): boolean {
  if (node.type === 'text') return (node.text ?? '').trim().length > 0;
  if (node.type === 'upload' || node.type === 'horizontalrule') return true;
  return (node.children ?? []).some(hasContent);
}

function renderText(node: LexNode, key: number): ReactNode {
  const text = node.text ?? '';
  const format = typeof node.format === 'number' ? node.format : 0;

  if ((format & 16) !== 0) {
    return (
      <code key={key} className="bg-surface rounded px-1.5 py-0.5 text-[0.9em] font-mono">
        {text}
      </code>
    );
  }

  let out: ReactNode = text;
  if ((format & 4) !== 0) out = <s>{out}</s>;
  if ((format & 8) !== 0) out = <u>{out}</u>;
  if ((format & 2) !== 0) out = <em>{out}</em>;
  if ((format & 1) !== 0) out = <strong>{out}</strong>;
  if ((format & 32) !== 0) out = <sub>{out}</sub>;
  if ((format & 64) !== 0) out = <sup>{out}</sup>;

  return <span key={key}>{out}</span>;
}

const HEADING_CLASS: Record<string, string> = {
  h1: 'text-h1 font-display font-semibold tracking-tight mt-4',
  h2: 'text-h2 font-display font-semibold tracking-tight mt-4',
  h3: 'text-h3 font-display font-semibold mt-3',
  h4: 'text-h4 font-display font-semibold mt-3',
  h5: 'text-lg font-semibold mt-2',
  h6: 'text-base font-semibold mt-2',
};

function renderHeading(node: LexNode, key: number): ReactNode {
  const tag = (node.tag ?? 'h2').toLowerCase();
  const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2') as 'h2';
  return (
    <Tag key={key} className={HEADING_CLASS[Tag] ?? HEADING_CLASS.h2}>
      {renderChildren(node)}
    </Tag>
  );
}

function renderList(node: LexNode, key: number): ReactNode {
  if (node.listType === 'number') {
    return (
      <ol key={key} className="list-decimal pl-6 flex flex-col gap-1.5">
        {renderChildren(node)}
      </ol>
    );
  }
  const isCheck = node.listType === 'check';
  return (
    <ul key={key} className={cn('pl-6 flex flex-col gap-1.5', isCheck ? 'list-none' : 'list-disc')}>
      {renderChildren(node)}
    </ul>
  );
}

function renderLink(node: LexNode, key: number): ReactNode {
  const fields = node.fields ?? {};
  const doc = fields.doc?.value;
  const internalSlug = typeof doc === 'object' && doc ? doc.slug : undefined;
  const href =
    fields.url ?? node.url ?? (internalSlug ? `/${internalSlug.replace(/^\//, '')}` : '#');
  const newTab = fields.newTab ?? node.newTab ?? false;

  return (
    <a
      key={key}
      href={href}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="text-accent underline underline-offset-2 hover:no-underline"
    >
      {renderChildren(node)}
    </a>
  );
}

/**
 * Картинка, вставленная в текст. Payload кладёт загруженный документ в
 * `node.value`; если populate не доехал (голый id) — рендерить нечего.
 */
function renderUpload(node: LexNode, key: number): ReactNode {
  const media = node.value;
  if (!media || typeof media !== 'object' || !media.url) return null;
  return (
    <figure key={key} className="flex flex-col gap-2 my-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.url}
        alt={media.alt ?? ''}
        {...(media.width ? { width: media.width } : {})}
        {...(media.height ? { height: media.height } : {})}
        className="w-full rounded-lg object-cover"
        loading="lazy"
      />
      {media.alt && <figcaption className="text-sm text-muted text-center">{media.alt}</figcaption>}
    </figure>
  );
}
