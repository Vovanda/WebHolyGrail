import type { MediaRef } from './media';

/**
 * Регалии собаки — одна строка в списке достижений (`titles[]` у {@link DogDoc}).
 *
 * @remarks
 * Не enum — у каждого титула в РКФ/FCI свой шифр и формулировка (CACIB, CW,
 * Чемпион РФ, J.CH., интерчемпион, рабочий класс, IPO, BH, ZTP, KKL и т.д.).
 * Заводчик сам формулирует текст, поэтому это просто `text` с опциональным
 * годом/местом.
 */
export interface DogTitle {
  /** Сама регалия — «Чемпион России», «CACIB Москва», «КС-1». */
  readonly text: string;
  /** Год получения, для сортировки и подписей. */
  readonly year?: number;
  /** Место / организация — «Москва, Евразия 2024», «РКФ-FCI». */
  readonly place?: string;
}

/** Пол собаки. */
export type DogSex = 'male' | 'female';

/**
 * Окрас восточноевропейской овчарки. Не строгий enum — для других пород значения
 * другие; на старте достаточно набора ВЕО, при расширении переедет в Globals.
 */
export type DogColor = 'cheprachny' | 'zonarny' | 'cherny';

/**
 * Публичная форма собаки (производителя / выпускника / щенка-подростка
 * оставшегося в питомнике). Источник правды — коллекция `Dogs` в Payload.
 *
 * @remarks
 * **Что НЕ Dog:** щенок из активного помёта на витрине — это {@link import('./litters').Puppy}
 * внутри {@link import('./litters').LitterDoc}, **не** запись в Dogs. Запись в
 * Dogs появляется только когда щенок остался в питомнике как производитель или
 * показывается на сайте как самостоятельная сущность с собственной карточкой.
 *
 * Это снимает дублирование: 8 щенков одного помёта **не** плодят 8 записей Dogs
 * с одинаковыми мама/папа.
 */
export interface DogDoc {
  readonly id: string;
  /** ЧПУ-slug: `/dog/<slug>`. */
  readonly slug: string;
  /** Кличка для админки и заголовка карточки. */
  readonly name: string;
  /** Пол. */
  readonly sex: DogSex;
  /** Дата рождения ISO `YYYY-MM-DD` (не timestamp — час рождения не нужен). */
  readonly dob?: string;
  /** Окрас. */
  readonly color?: DogColor;
  /** Фотографии собаки в порядке отображения. Первая = главная. */
  readonly photos?: readonly MediaRef[];
  /**
   * Регалии — массив отдельных строк. Порядок отображения = порядок в массиве
   * (заводчик сам решает что вперёд: свежее или весомое).
   */
  readonly titles?: readonly DogTitle[];
  /**
   * Описание собаки — rich text Lexical-сериализация (JSON-объект).
   * На клиенте рендерится через `<RichText>` из @payloadcms/richtext-lexical.
   */
  readonly description?: unknown;
  /** Ссылка на родословную (PDF / страница в РКФ-базе). */
  readonly pedigreeUrl?: string;
  readonly updatedAt: string;
}
