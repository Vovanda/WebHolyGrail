import type { BlockNode } from './blocks';

/**
 * Один вопрос внутри FAQ-группы. `answer` — Lexical AST.
 */
export interface FaqItemDoc {
  readonly question: string;
  readonly answer: unknown;
  readonly openByDefault?: boolean;
}

/**
 * FAQ-группа — отдельная сущность (Collection `faq-groups`). Содержит
 * `items[]` — вопросы группы. Порядок групп задаётся `order`.
 *
 * @remarks
 * Используется блоком `faq-accordion` на странице: либо все опубликованные
 * группы по `order`, либо отфильтрованные через `groups` relation в блоке.
 */
export interface FaqGroupDoc {
  readonly id: string | number;
  readonly title: string;
  readonly emoji?: string;
  readonly order: number;
  readonly slug?: string;
  readonly items: ReadonlyArray<FaqItemDoc>;
}

/**
 * CTA-блок «не нашли ответ?» под аккордеоном.
 */
export interface FaqAccordionCta {
  readonly text?: string;
  readonly linkLabel?: string;
  readonly linkHref?: string;
}

/**
 * FAQ-аккордеон — блок на странице. Сам не содержит вопросов — берёт их из
 * Collection `faq-groups`. Поле `groups` — фильтр (если пусто, рендерятся все
 * опубликованные).
 */
export interface FaqAccordionBlockData {
  readonly title: string;
  readonly titleEmoji?: string;
  readonly lead?: string;
  readonly showChips?: boolean;
  /** Relation hasMany на FaqGroupDoc — либо id-список, либо populated documents. */
  readonly groups?: ReadonlyArray<string | number | FaqGroupDoc>;
  readonly cta?: FaqAccordionCta;
}

export type FaqAccordionBlockNode = BlockNode & {
  readonly blockType: 'faq-accordion';
  readonly data?: FaqAccordionBlockData;
};
