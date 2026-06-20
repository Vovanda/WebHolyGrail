import type { ImageRef } from './blocks';
import type { DogColor, DogDoc, DogSex } from './dogs';
import type { MediaRef } from './media';

/**
 * Состояние щенка в активном помёте — определяет рендер карточки на витрине.
 *
 * @remarks
 * - `available` — свободен, показывается с зелёной меткой.
 * - `reserved` — в брони, показывается с серой меткой «забронирован».
 * - `sold` — уже продан, **не рендерится по умолчанию** (флаг блока `showSold`
 *   на будущее, если когда-то понадобится «галерея проданных»).
 * - `hidden` — скрыт в админке, **не рендерится никогда** (мама не хочет
 *   показывать конкретного, или временно убирает с витрины).
 */
export type PuppyState = 'available' | 'reserved' | 'sold' | 'hidden';

/**
 * Один щенок в помёте. Хранится **внутри** {@link LitterDoc.puppies} как nested
 * запись, не как отдельная коллекция (см. memo `HolyGrail/38` про invariants
 * vs nested data).
 *
 * @remarks
 * Если щенок остался в питомнике и стал производителем — заводится отдельная
 * запись в {@link DogDoc}; здесь же он живёт пока в активном помёте. Это
 * убирает дублирование: 10 щенков одного помёта = 1 запись Litters + 10
 * элементов массива, а не 10 записей Dogs.
 */
export interface Puppy {
  /** Стабильный id внутри массива (Payload генерирует). React-key. */
  readonly id: string;
  /** Кличка / прозвище. Может быть пустой если ещё не выбрана. */
  readonly name?: string;
  /** Пол. */
  readonly sex: DogSex;
  /** Окрас (наследуется по умолчанию из помёта, может быть переопределён). */
  readonly color?: DogColor;
  /** Главное фото для карточки. */
  readonly photo?: MediaRef;
  /** Состояние — управляет видимостью и меткой. */
  readonly state: PuppyState;
  /**
   * Короткая заметка под карточкой («крупный, активный», «домашний любимец»).
   * Опционально — карточка читается и без неё.
   */
  readonly notes?: string;
}

/**
 * Статус помёта целиком — управляет видимостью секции на сайте.
 *
 * @remarks
 * - `active` — отображается в `/puppies` и на главной (если выставлен туда).
 * - `archived` — попадает в `/puppies/archive` (история помётов), не на главной.
 * - `hidden` — не рендерится нигде, даже в архиве. Для черновиков и тестов.
 */
export type LitterStatus = 'active' | 'archived' | 'hidden';

/**
 * Визитка пары — заводческий термин. См. `docs/glossary.md → Визитка пары`.
 *
 * Картинка(и) родителей помёта + краткая подпись с регалиями. Покупателю
 * это показывают первым перед щенками: «вот мама + папа, вот их титулы».
 * Обычно собрана заводчиком в редакторе типа Canva.
 *
 * @remarks
 * **Опциональна целиком.** Бывают помёты без визитки — тогда блок её просто
 * не рендерит, верхняя часть {@link LitterCardBlockNode} занимается только
 * щенками. См. адаптивную раскладку в `client/blocks/content/LitterCardBlock`.
 */
export interface PairCard {
  /**
   * Готовые графические карточки пары — одна или несколько вариантов
   * (например с разными надписями / для разных каналов). Порядок = порядок
   * в массиве; первая считается основной. Пустой массив = визитки нет.
   */
  readonly images: ReadonlyArray<{ readonly id: string; readonly image: MediaRef }>;
  /** Опциональная подпись под визиткой (краткие регалии пары, дата вязки). */
  readonly caption?: string;
}

/**
 * Помёт — структурная единица разведения у ВЕО. Группа щенков от одной пары
 * с общей датой рождения. Источник правды — коллекция `Litters` в Payload.
 *
 * @remarks
 * **Зачем сущность вообще:** у помёта есть **общие поля** (мама, папа, визитка,
 * описание, флаги, статус) которые с плоской `Puppies` дублировались бы в
 * каждой записи. Помёт хранит их один раз и связывает с массивом {@link Puppy}.
 *
 * Архивация целиком = один клик `status = 'archived'`. Кастомные блоки для
 * нестандартной секции («отборное поведение Чипсы») лежат **рядом** с
 * `LitterCard` на странице помёта в `Pages.blocks[]` — это обычные Prose/Quote,
 * не часть {@link LitterDoc}.
 */
export interface LitterDoc {
  readonly id: string;
  /** Заголовок для админки и шапки секции — «Помёт литера Н, 2026». */
  readonly title: string;
  /** Дата рождения помёта ISO `YYYY-MM-DD`. */
  readonly dob: string;
  /**
   * Буква помёта в латинской транслитерации: `n`, `o`, `ya`, `zh`, `sch`…
   * Полный URL детальной — `/puppies/<dob>/<letter>`.
   */
  readonly letter: string;
  /** Мать — ссылка на запись {@link DogDoc} (relation). */
  readonly mother: string | DogDoc;
  /** Отец — ссылка на запись {@link DogDoc} (relation). */
  readonly father: string | DogDoc;
  /** Визитка пары — опционально. */
  readonly pairCard?: PairCard;
  /** Описание помёта — rich text Lexical. */
  readonly description?: unknown;
  /** Показывать ли краткие регалии матери под её именем. */
  readonly showMotherTitles: boolean;
  /** Показывать ли описание матери (поле `Dogs.description`). */
  readonly showMotherDescription: boolean;
  /** Показывать ли краткие регалии отца под его именем. */
  readonly showFatherTitles: boolean;
  /** Показывать ли описание отца. */
  readonly showFatherDescription: boolean;
  /** Щенки помёта. Порядок отображения = порядок в массиве (мама управляет). */
  readonly puppies: readonly Puppy[];
  /** Статус — управляет видимостью на сайте. */
  readonly status: LitterStatus;
  readonly updatedAt: string;
}

/**
 * Блок страницы — карточка помёта. Ссылается на {@link LitterDoc} по id и
 * подтягивает всё (родители, визитка, щенки, флаги) на этапе server-render.
 *
 * @remarks
 * Один помёт → одна карточка → одна страница в `Pages.blocks[]`. На страничке
 * помёта рядом с `LitterCard` можно положить произвольные `Prose`/`Quote`
 * блоки — так делается «нестандартная» секция типа «отборное поведение Чипсы».
 * Сам блок остаётся простым (только ссылка на Litter), вся гибкость — за счёт
 * композиции на уровне страницы.
 *
 * **R5+:** сериализуем (`litterId` — строка), без `ReactNode`/callback'ов.
 */
export interface LitterCardBlockNode {
  readonly blockType: 'litter-card';
  readonly id: string;
  /** ID записи в коллекции `Litters`. */
  readonly litterId: string;
  /**
   * Показать продaнных щенков (`state = 'sold'`) в общей сетке.
   *
   * @remarks
   * Дефолт `false` — sold-щенки скрываются с витрины активного помёта (мама
   * не хочет «галерею проданных» на главной). Включается, например, для
   * страницы-архива помёта.
   */
  readonly showSold?: boolean;
}

/** Доп. поле блока — расширенная визитка пары, см. {@link ImageRef} для совместимости. */
export type LitterPairImage = ImageRef;

/**
 * Декомпозиция `LitterCardBlockNode` на 3 атомарных блока — даёт возможность
 * располагать заголовок/визитку/щенков произвольно (между ними любые
 * Prose/Quote/AchievementBanner) и фреймить каждый независимо. Все три
 * ссылаются на одну и ту же запись `Litters` через `litterId`.
 */
export interface LitterHeaderBlockNode {
  readonly blockType: 'litter-header';
  readonly id: string;
  /** ID записи в коллекции `Litters`. */
  readonly litterId: string;
}

/** См. {@link LitterHeaderBlockNode}. Визитка пары родителей. */
export interface LitterPairCardBlockNode {
  readonly blockType: 'litter-pair-card';
  readonly id: string;
  readonly litterId: string;
}

/** См. {@link LitterHeaderBlockNode}. Сетка карточек щенков. */
export interface LitterPuppiesBlockNode {
  readonly blockType: 'litter-puppies';
  readonly id: string;
  readonly litterId: string;
  /** См. {@link LitterCardBlockNode.showSold}. */
  readonly showSold?: boolean;
}
