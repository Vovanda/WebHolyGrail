import { createServerFeature } from '@payloadcms/richtext-lexical';

/**
 * Место вставки готово сразу, как открылась статья.
 *
 * @remarks
 * Сама работа - в браузере, здесь только объявление: серверу нужно знать про
 * возможность редактора, чтобы отдать её админке. Что она делает и зачем -
 * в `caret-ready.client.tsx`.
 */
export const CaretReadyFeature = createServerFeature({
  feature: {
    ClientFeature: '/editor/caret-ready.client#CaretReadyClientFeature',
  },
  key: 'caretReady',
});
