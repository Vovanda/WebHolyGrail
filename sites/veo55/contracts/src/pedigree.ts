/**
 * Pedigree-блок — секция «Родословная» на странице собаки или помёта.
 * Параметризован одной собакой; данные родословной берутся из её
 * {@link import('./dogs').DogDoc.pedigree}. R5+/R5++.
 */
export interface PedigreeBlockNode {
  readonly blockType: 'pedigree';
  readonly id: string;
  /** ID записи в коллекции Dogs. */
  readonly dogId: string;
  /**
   * Заголовок секции, опционально. Если пусто — рендерится дефолтный
   * («Родословная»).
   */
  readonly title?: string;
}
