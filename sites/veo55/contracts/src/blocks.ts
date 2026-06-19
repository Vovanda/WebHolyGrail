import type { MediaRef } from './media';

/**
 * Узел блочного дерева страницы. Базовый тип, от которого наследуются конкретные блоки.
 *
 * @remarks
 * **Сериализуемость (R5+).** Все блоки и их пропсы — JSON-сериализуемые: только примитивы,
 * массивы, объекты, ссылки на медиа (id), вложенные {@link BlockNode}. Это закладка
 * под будущий визуальный конструктор уровня 3 (см. Memory `HolyGrail/36`).
 * Никаких `React.ReactNode`, function-props, экземпляров классов в публичном контракте.
 *
 * Конкретные блоки добавляются по мере появления (R9), не авансом. Здесь — базовый тип.
 */
export interface BlockNode {
  /**
   * Discriminator — имя блока. Совпадает с ключом в `client/blocks/registry`
   * и `slug`-полем Payload-блока.
   */
  readonly blockType: string;
  /**
   * Уникальный id блока внутри страницы (для React key и редактора в будущем).
   * Payload генерирует автоматически.
   */
  readonly id: string;
}

/**
 * Layout-блок: контейнер с вложенными детьми (Grid / Stack / Columns).
 *
 * @remarks
 * Дети — массив **описаний** блоков ({@link BlockNode}), не React-ноды.
 * Это позволяет рекурсивно рендерить и редактировать дерево в будущем визуальном
 * конструкторе (см. Memory `HolyGrail/36`, R5+).
 */
export interface LayoutBlock extends BlockNode {
  readonly children: readonly BlockNode[];
}

/** Универсальная картинка, используемая блоками. */
export interface ImageRef {
  readonly media: MediaRef;
  /** Переопределение alt из медиа, если блок-специфичный текст. */
  readonly alt?: string;
}

/** Ссылка/CTA, используемая блоками (Hero, CTA, Card). */
export interface LinkRef {
  /** Внутренний путь (`/about`) или абсолютный URL. */
  readonly href: string;
  /** Подпись ссылки/кнопки. */
  readonly label: string;
  /** Открывать ли в новой вкладке. */
  readonly external?: boolean;
}
