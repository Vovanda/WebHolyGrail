import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { BlockNode, MediaDoc, SiteSettings } from 'contracts';
import { renderBlockNode } from '@/layouts/site-layout/block-registry';
import { singleFrameAspect } from '@/lib/media';
import { MediaImage } from '../Media';

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
  /**
   * Настройки сайта — нужны блокам, вставленным прямо в текст.
   *
   * @remarks
   * Без них блоки не рисуются: часть читает оттуда оформление, и подсунуть
   * пустышку значит получить вставку без темы.
   */
  readonly settings?: SiteSettings | undefined;
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
  /**
   * Вставленный файл: редактор кладёт сюда документ медиатеки целиком.
   *
   * @remarks
   * Описывать его здесь своими полями нельзя: у документа есть варианты
   * нарезки, и урезанный тип отрезал бы показ от них - картинка в тексте
   * снова поехала бы оригиналом.
   */
  readonly value?: MediaDoc;
  readonly relationTo?: string;
  readonly language?: string;
}

export function LexicalRenderer({ value, className, settings }: LexicalRendererProps) {
  const root = (value as { root?: LexNode } | null | undefined)?.root;
  if (!root?.children?.length) return null;

  /*
    Верхние кадры грузятся вне общей очереди. Ленивая загрузка сама порядка
    не держит: браузер берёт кадры как придётся, и нижний снимок появляется
    раньше верхнего - читающий видит, как страница собирается задом наперёд.
  */
  const PRIORITY_COUNT = 2;
  const priority = new Set(
    root.children
      .map((node, i) => (node.type === 'upload' ? i : -1))
      .filter((i) => i >= 0)
      .slice(0, PRIORITY_COUNT),
  );

  return (
    <div className={cn('flex flex-col gap-5 text-ink leading-relaxed', className)}>
      {root.children.map((node, index) => renderNode(node, index, settings, priority))}
    </div>
  );
}

function renderNode(
  node: LexNode,
  key: number,
  settings?: SiteSettings,
  priority: ReadonlySet<number> = new Set(),
): ReactNode {
  if (!node) return null;

  switch (node.type) {
    case 'text':
      return renderText(node, key);

    case 'linebreak':
      return <br key={key} />;

    case 'paragraph': {
      const children = renderChildren(node, settings);
      // Пустой абзац в редакторе — это отступ, а не текст. Схлопываем.
      if (!hasContent(node)) return null;
      return <p key={key}>{children}</p>;
    }

    case 'heading':
      return renderHeading(node, key, settings);

    case 'list':
      return renderList(node, key, settings);

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
          {renderChildren(node, settings)}
        </li>
      );

    case 'quote':
      return (
        <blockquote
          key={key}
          className="border-l-2 border-accent pl-4 italic font-display text-ink/90"
        >
          {renderChildren(node, settings)}
        </blockquote>
      );

    case 'code':
      return (
        <pre
          key={key}
          className="bg-surface rounded-md p-4 overflow-x-auto text-sm font-mono text-ink"
        >
          <code>{renderChildren(node, settings)}</code>
        </pre>
      );

    case 'horizontalrule':
    case 'horizontalRule':
      return <hr key={key} className="border-line my-2" />;

    case 'link':
    case 'autolink':
      return renderLink(node, key, settings);

    case 'upload':
      /*
        Первый кадр статьи виден сразу при открытии, поэтому грузится не в общей
        очереди, а раньше прочего: иначе браузер берёт картинки как придётся,
        и нижняя появляется прежде верхней.
      */
      return renderUpload(node, key, priority.has(key));

    case 'block':
      return renderBlock(node, key, settings);

    default:
      // Неизвестный узел — не теряем его содержимое.
      return node.children?.length ? <span key={key}>{renderChildren(node, settings)}</span> : null;
  }
}

function renderChildren(node: LexNode, settings?: SiteSettings): ReactNode[] {
  return (node.children ?? []).map((child, index) => renderNode(child, index, settings));
}

/**
 * Блок, вставленный прямо в текст.
 *
 * @remarks
 * Рендерится тем же реестром, что и блоки страницы: иначе видео в статье и
 * видео на странице пришлось бы поддерживать по отдельности, и они разошлись бы
 * на первой же правке.
 *
 * Блок идёт на всю колонку статьи, а не в строку текста (`flow-wide`): видео
 * шириной в строку посреди статьи выглядит вставкой из другого макета.
 *
 * Вертикальные поля задаёт обёртка. Собственные поля секции здесь снимаются:
 * на странице они отделяют её от соседних секций, а внутри статьи складываются
 * с отступами абзацев, и вокруг видео образуется пустая полоса.
 */
const IN_TEXT_FLOW = new Set(['collapsible']);

function renderBlock(node: LexNode, key: number, settings?: SiteSettings): ReactNode {
  const fields = (node as { fields?: Record<string, unknown> }).fields;
  const blockType = typeof fields?.['blockType'] === 'string' ? fields['blockType'] : null;
  // Без настроек сайта блоки не рисуем: часть из них читает оттуда оформление,
  // и подсунуть им пустышку значит получить страницу без темы.
  if (!blockType || !settings) return null;

  /*
    Блок, который читается частью текста, из колонки не выходит и своего шага не
    просит: расстояние вокруг него задаёт та же щель, что между абзацами. Поля и
    ширину секции здесь снимаем - на странице они отделяют её от соседних секций.
  */
  if (IN_TEXT_FLOW.has(blockType)) {
    return (
      <div
        key={key}
        className="[&>section]:mx-0 [&>section]:max-w-none [&>section]:px-0 [&>section]:py-0"
      >
        {renderBlockNode({ blockType, id: String(key), data: fields } as BlockNode, settings)}
      </div>
    );
  }

  return (
    <div key={key} className="flow-wide my-6 [&>section]:py-0">
      {renderBlockNode({ blockType, id: String(key), data: fields } as BlockNode, settings)}
    </div>
  );
}

/** Есть ли в поддереве хоть какой-то видимый контент. */
function hasContent(node: LexNode): boolean {
  if (node.type === 'text') return (node.text ?? '').trim().length > 0;
  if (node.type === 'upload' || node.type === 'horizontalrule' || node.type === 'block')
    return true;
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

function renderHeading(node: LexNode, key: number, settings?: SiteSettings): ReactNode {
  const tag = (node.tag ?? 'h2').toLowerCase();
  const Tag = (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag) ? tag : 'h2') as 'h2';
  return (
    <Tag key={key} className={HEADING_CLASS[Tag] ?? HEADING_CLASS.h2}>
      {renderChildren(node, settings)}
    </Tag>
  );
}

function renderList(node: LexNode, key: number, settings?: SiteSettings): ReactNode {
  if (node.listType === 'number') {
    return (
      <ol key={key} className="list-decimal pl-6 flex flex-col gap-1.5">
        {renderChildren(node, settings)}
      </ol>
    );
  }
  const isCheck = node.listType === 'check';
  return (
    <ul key={key} className={cn('pl-6 flex flex-col gap-1.5', isCheck ? 'list-none' : 'list-disc')}>
      {renderChildren(node, settings)}
    </ul>
  );
}

function renderLink(node: LexNode, key: number, settings?: SiteSettings): ReactNode {
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
      {renderChildren(node, settings)}
    </a>
  );
}

/**
 * Сколько места занимает картинка в тексте статьи.
 *
 * @remarks
 * Колонка текста упирается в ширину читаемой строки, на телефоне занимает её
 * целиком. Значение должно совпадать с вёрсткой: сказав больше, чем есть,
 * получаешь вариант крупнее нужного - при 880 вместо 830 браузер уходил
 * на ступень вверх и тянул полуторамегабайтный кадр.
 */
const TEXT_COLUMN_SIZES = '(max-width: 832px) 100vw, 832px';

/**
 * Картинка, вставленная в текст.
 *
 * @remarks
 * Payload кладёт документ в `node.value`; голый номер - файл не раскрылся,
 * рисовать нечего.
 *
 * Кадр идёт одной из двух форм - 16:9 или 9:16 - и подрезается вокруг точки,
 * выбранной владельцем: снимки любой формы дают в статье ровный ритм. Ширину
 * держит потолок высоты, поэтому стоячий кадр не занимает три экрана.
 * Целиком, как снят, кадр показывает лента.
 */
function renderUpload(node: LexNode, key: number, isPriority: boolean): ReactNode {
  const media = node.value;
  if (!media || typeof media !== 'object' || !media.url) return null;
  /*
    Под кадром - его название, тот же заголовок, что в ленте. Без названия
    идёт alt: так подписаны кадры в уже написанных статьях, и подпись у них
    не должна пропасть.
  */
  const caption = media.caption || media.alt;
  return (
    <figure key={key} className="flex flex-col gap-2 my-2">
      <MediaImage
        media={media}
        place={TEXT_COLUMN_SIZES}
        aspect={singleFrameAspect(media)}
        className="media-single rounded-lg"
        loading={isPriority ? 'eager' : 'lazy'}
        {...(isPriority ? { fetchPriority: 'high' as const } : {})}
      />
      {caption && <figcaption className="text-sm text-muted text-center">{caption}</figcaption>}
    </figure>
  );
}
