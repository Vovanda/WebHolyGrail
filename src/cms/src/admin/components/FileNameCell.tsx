'use client';

import type { DefaultCellComponentProps } from 'payload';

/**
 * Имя файла в списке.
 *
 * @remarks
 * Своя ячейка нужна ради того, чего в ней нет: Payload рисует рядом с именем
 * миниатюру файла, а у видео и документов миниатюры не бывает - вместо неё
 * во всех строках подряд стоит одинаковый значок документа. Кадр при этом
 * показан соседней колонкой, так что значок не говорит ничего и только сбивает
 * взгляд при поиске по имени.
 */
export function FileNameCell({ cellData }: DefaultCellComponentProps): React.ReactNode {
  return <span>{typeof cellData === 'string' ? cellData : ''}</span>;
}
