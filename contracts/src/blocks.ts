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
 * плейлист значений, когда до них дойдёт (R9).
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

/**
 * Оформление блока: свой стиль, ограниченный самим блоком.
 *
 * @remarks
 * Владелец пишет обычный CSS - `margin: 40px 0`, `border-radius: 16px 16px 0 0`,
 * а при нужде и правила для того, что лежит внутри. Записывается всё как есть,
 * без выдуманных слов вроде «просторно» и без частокола полей на каждый угол.
 *
 * Ограничение ровно одно - область видимости: написанное действует на сам блок
 * и на то, что внутри него, и не достаёт до остальной страницы. Разбирать CSS
 * самим не нужно: строка вкладывается в селектор блока, а вложенность браузер
 * читает сам.
 *
 * Пусто - блок ведёт себя как принято на сайте.
 */

/**
 * Часть блока, которую владелец вправе донастроить.
 *
 * @remarks
 * Блок сам называет свои части и помечает их в разметке признаком `data-part`.
 * Классы для этого не годятся: они машинные и меняются при первой же правке
 * вёрстки, а признак - договорённость, которую держим мы.
 *
 * Тег указывается рядом: по нему сразу видно, с чем имеешь дело - строка списка
 * это или картинка.
 */
export interface BlockPart {
  /** Имя в разметке: `data-part="title"`. */
  readonly name: string;
  /** Как называть его человеку. */
  readonly label: string;
  /** Тег, которым часть отрисована: `li`, `img`, `div`. */
  readonly tag?: string;
  /** Что лежит внутри этой части. */
  readonly parts?: readonly BlockPart[];
}

/** Строка списка частей: что показать, что скопировать и как глубоко лежит. */
export interface PartRow {
  /** Как показать: `li[data-part=card]`. */
  readonly label: string;
  /** Человеческое название. */
  readonly title: string;
  /** Что уйдёт в буфер - полный путь от блока. */
  readonly selector: string;
  /** Глубина вложенности, от нуля. */
  readonly depth: number;
}

/**
 * Части блока строками - для списка в админке.
 *
 * @remarks
 * Показываем обычный CSS-селектор, а не свою краткую запись: сокращение вроде
 * `div[card]` короче, но в него не допишешь ни состояние, ни класс, а
 * `li[data-part=card]:hover` пишется само собой. Кавычки в атрибуте
 * необязательны, поэтому строка и так недлинная.
 *
 * Вложенность передаётся глубиной, а не повтором пути в каждой строке: иначе
 * список превращается в полотно из одинаковых начал.
 */
export function flattenParts(
  parts: readonly BlockPart[] | undefined,
  depth = 0,
  prefix = '',
): readonly PartRow[] {
  if (!parts?.length) return [];

  return parts.flatMap((part) => {
    const step = `${part.tag ?? 'div'}[data-part=${part.name}]`;
    const selector = prefix ? `${prefix} > ${step}` : step;
    return [
      { label: step, title: part.label, selector, depth },
      ...flattenParts(part.parts, depth + 1, selector),
    ];
  });
}

export const PALETTE_COLORS = [
  { value: 'var(--color-bg)', label: 'Лист страницы', sample: '#ffffff' },
  { value: 'var(--color-page-bg)', label: 'Подложка вокруг листа', sample: '#fafafa' },
  { value: 'var(--color-surface)', label: 'Карточка', sample: '#f5f5f5' },
  { value: 'var(--color-ink)', label: 'Текст', sample: '#0a0a0a' },
  { value: 'var(--color-muted)', label: 'Приглушённый текст', sample: '#737373' },
  { value: 'var(--color-border)', label: 'Граница', sample: '#e5e5e5' },
  { value: 'var(--color-accent)', label: 'Акцент', sample: '#2563eb' },
  { value: 'var(--color-accent-soft)', label: 'Акцент бледный', sample: '#dbeafe' },
] as const;

export const APPEARANCE_WARNING =
  'Переопределяет то, как блок уже выглядит, обычным CSS - для него самого и того, ' +
  'что внутри него. Пусто - блок выглядит так, как задуман. Трогать без нужды не стоит: ' +
  'ошибка здесь ломает вид страницы, и видно это будет сразу. ' +
  'Именованные части ниже переживут правку вёрстки; писать по тегам и классам тоже ' +
  'можно, но они меняются - смотреть настоящую разметку удобнее в средствах ' +
  'разработчика прямо на странице.';

/**
 * Обернуть стиль владельца в область видимости блока.
 *
 * @remarks
 * Возвращает готовое правило или пустую строку, если писать нечего.
 *
 * Область видимости держится на двух проверках, иначе она была бы на честном
 * слове:
 *
 * - скобки должны быть уравновешены и ни в одном месте закрывающих не больше,
 *   чем открытых. Иначе `} body { display: none }` оборвал бы наш селектор,
 *   и остаток ушёл бы на всю страницу;
 * - закрывающий тег стиля вырезается: иначе он оборвал бы стиль в разметке
 *   и позволил вставить туда что угодно.
 *
 * Не прошло проверку - стиль не применяется вовсе: сломанная страница хуже,
 * чем не сработавшая настройка.
 *
 * @example
 * scopedAppearance('b7', 'margin: 40px 0; [data-part="title"] { font-size: 32px }')
 * // '[data-block="b7"] { margin: 40px 0; [data-part="title"] { font-size: 32px } }'
 */
export function scopedAppearance(blockId: string, source: string | null | undefined): string {
  const css = (source ?? '').replace(/<\/?style/gi, '').trim();
  if (!css) return '';
  if (!balanced(css)) return '';

  return `[data-block="${blockId}"] { ${css} }`;
}

/** Скобки уравновешены и нигде не закрываются раньше, чем открылись. */
function balanced(css: string): boolean {
  let depth = 0;
  for (const char of css) {
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}
