/**
 * Какой блок встаёт в текст, когда владелец прикладывает файл.
 *
 * @remarks
 * Своего показа у вложения нет: для снимка, записи и документа в наборе
 * уже есть блоки, и вложение ставит один из них с выбранным файлом.
 * Снимок идёт галереей из одного кадра - она открывается общей лентой
 * и держит потолок высоты; запись - блоком видео; остальное - строкой
 * документов.
 *
 * Заголовок у документов пустой явно: по умолчанию блок подписывает себя
 * «Документы», а файлу посреди текста заголовок раздела не нужен.
 */

/** Откуда берётся вложение: поля всех трёх блоков ведут в медиатеку. */
export const ATTACHMENT_COLLECTION = 'media';

/** Что известно о выбранном файле: номер в медиатеке и тип. */
export interface AttachedFile {
  readonly id: number | string;
  readonly mimeType?: string | null | undefined;
}

/** Поля вставляемого блока - то, что принимает команда вставки редактора. */
export interface AttachmentBlockFields {
  readonly blockName: '';
  readonly blockType: string;
  readonly [field: string]: unknown;
}

export function attachmentBlock(file: AttachedFile): AttachmentBlockFields {
  const kind = file.mimeType?.split('/')[0];

  if (kind === 'image') {
    return { blockName: '', blockType: 'gallery', files: [file.id], view: 'list' };
  }
  if (kind === 'video') {
    return { blockName: '', blockType: 'video', video: file.id };
  }
  return {
    blockName: '',
    blockType: 'document-list',
    heading: '',
    items: [{ file: file.id }],
    layout: 'list',
  };
}
