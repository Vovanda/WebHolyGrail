import type { BlockNode } from './blocks';
import type { MediaRef } from './media';

/**
 * SEO-метаданные страницы. Прикрепляются к каждой `Page`.
 *
 * @remarks
 * Все поля опциональны — если не заданы, фронт должен подставить разумные
 * фолбэки из контента страницы (например `title` → первый Hero-заголовок).
 */
export interface PageSeo {
  /** Override `<title>`. Если нет — берётся `Page.title`. */
  readonly title?: string;
  /** `<meta name="description">`. */
  readonly description?: string;
  /** Open Graph image для соцсетей. */
  readonly ogImage?: MediaRef;
  /** Canonical URL (если страница доступна по нескольким). */
  readonly canonical?: string;
  /** `noindex,nofollow` для черновиков/служебных страниц. */
  readonly noindex?: boolean;
}

/**
 * Публичная форма страницы сайта. Источник правды — коллекция `Pages` в Payload.
 *
 * @remarks
 * Страница = `slug` + дерево {@link BlockNode}. Бизнес-сущности (Dogs/Litters) —
 * это **другие коллекции**, не Pages. У них свои детальные страницы которые
 * рендерятся отдельным шаблоном, а не через `blocks[]`.
 */
export interface PageDoc {
  readonly id: string;
  /** ЧПУ страницы без ведущего слэша: `about`, `contacts`, `''` для главной. */
  readonly slug: string;
  /** Заголовок страницы (для админки и фолбэк-SEO). */
  readonly title: string;
  /** Корневой массив блоков. Рендерится в порядке появления. */
  readonly blocks: readonly BlockNode[];
  /** SEO-метаданные. */
  readonly seo?: PageSeo;
  /** Опубликована ли страница (Payload draft/published). */
  readonly published: boolean;
  /** ISO дата последнего обновления контента. */
  readonly updatedAt: string;
}
