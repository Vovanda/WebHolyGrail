import type { PedigreeAncestor } from './dogs';

/**
 * Типы РКФ-каталога — данные парсера `veorkf.ru` (не наша БД!).
 *
 * @remarks
 * Используется страницей `/catalog` (прокси-карточка РКФ-собаки) и
 * `/api/rkf/*` endpoint'ами Payload. На стороне сервера живёт парсер
 * (`cms/src/lib/rkf/`), на стороне клиента — рендер.
 */

/** Один информационный пункт карточки («Дата рождения» / «Окрас» / …). */
export interface RkfInfoField {
  readonly label: string;
  readonly value: string;
}

/** Фото собаки из РКФ-каталога (jpg, разные размеры через `s=`). */
export interface RkfPhoto {
  readonly url: string;
  readonly n: number;
  readonly author?: string;
}

/** Краткая ссылка на родителя в карточке РКФ. */
export interface RkfRelation {
  readonly id: number;
  readonly name: string;
}

/** Полная карточка собаки РКФ — то что отдаёт `GET /api/rkf/dog?id=N`. */
export interface RkfDogDoc {
  readonly id: number;
  readonly name: string;
  readonly nameLat?: string;
  readonly photos: ReadonlyArray<RkfPhoto>;
  readonly info: ReadonlyArray<RkfInfoField>;
  readonly father?: RkfRelation;
  readonly mother?: RkfRelation;
  readonly pedigree: ReadonlyArray<PedigreeAncestor>;
}

/** Один результат РКФ-поиска (таблица search.php). */
export interface RkfSearchItem {
  readonly id: number;
  readonly name: string;
  readonly birth?: string;
}

/** Одна страница РКФ-поиска — то что отдаёт `GET /api/rkf/search?q=X&page=N`. */
export interface RkfSearchPage {
  readonly query: string;
  readonly page: number;
  readonly count: number;
  readonly hasMore: boolean;
  readonly items: ReadonlyArray<RkfSearchItem>;
}
