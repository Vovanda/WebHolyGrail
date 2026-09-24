import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * «Фото/Видео/Документ»: файл медиатеки встаёт в текст готовым блоком.
 *
 * @remarks
 * Штатное «Загрузить» ставит голую картинку; здесь по типу файла встаёт
 * галерея, видео или документы. Сама загрузка остаётся включённой - на ней
 * стоят картинки в уже написанных статьях. Работа в браузере -
 * в `attachment.client.tsx`.
 */
export const AttachmentFeature = createServerFeature({
  feature: {
    ClientFeature: '/editor/attachment.client#AttachmentClientFeature',
  },
  key: 'attachment',
});
