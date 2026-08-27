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
  /**
   * Данные блока — поля что мама заполнила в Payload-админке. Структура зависит
   * от `blockType`; конкретный блок-компонент знает свой shape и читает через
   * type-narrowing. Это **источник правды контента** (R0).
   */
  readonly data?: Readonly<Record<string, unknown>>;
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

/**
 * Карточка ленты: то, что человек заводит в админке.
 *
 * @remarks
 * Ровно то, из чего собирается плитка - картинка, подпись, пояснение и куда
 * ведёт. React-узлов здесь нет: описание блока сериализуемое (R5+), и его
 * читает как сайт, так и будущий редактор страниц.
 */
export interface CarouselCard {
  readonly image?: ImageRef;
  readonly title?: string;
  readonly text?: string;
  readonly link?: LinkRef;
}

/**
 * Откуда лента берёт карточки.
 *
 * @remarks
 * `manual` - карточки заведены руками. Остальные значения - живые коллекции
 * сайта: лента показывает последние записи и обновляется сама, без правки
 * страницы.
 *
 * Отбор описан здесь же, а не в самой ленте: список и плитка получат тот же
 * набор значений, когда до них дойдёт (R9).
 */
export interface BlockSource {
  readonly kind: 'manual' | 'articles' | 'videos';
  /** Канал, чьи видео показывать. */
  readonly channel?: string;
  /** Сколько показать. */
  readonly limit?: number;
  /** Порядок: свежие сверху или как задано вручную. */
  readonly order?: 'newest' | 'oldest' | 'manual';
  /** Отбор по метке или разделу, когда коллекция это поддерживает. */
  readonly tag?: string;
}

/** Данные блока «Карусель». */
export interface CarouselBlockData {
  readonly heading?: string;
  readonly subtitle?: string;
  /** Кадром во всю ширину или лентой карточек. */
  readonly mode?: 'single' | 'row';
  readonly source?: BlockSource;
  readonly cards?: readonly CarouselCard[];
  /** Стрелки по краям. */
  readonly arrows?: boolean;
  /** Точки под лентой. */
  readonly dots?: boolean;
  /** Идти по кругу. */
  readonly loop?: boolean;
  /** Пауза между кадрами в секундах. Ноль - листать только руками. */
  readonly autoplaySeconds?: number;
  /** Ширина карточки: значение CSS. */
  readonly cardWidth?: string;
  /** Пропорции кадра, например `16 / 9`. */
  readonly aspect?: string;
}
