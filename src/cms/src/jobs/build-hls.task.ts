import type { TaskConfig } from 'payload';

import { defaultVideoPorts } from '../lib/media/adapters';
import { buildHls } from '../lib/media/build-hls';

/**
 * Нарезка загруженного видео в HLS.
 *
 * @remarks
 * Фоновая задача, а не работа в запросе загрузки: ffmpeg проходит по видео
 * целиком, на десятиминутном это минуты, и держать столько открытым соединение
 * админки нельзя — браузер отвалится по таймауту раньше.
 *
 * Две попытки: типичная причина отказа — сеть до хранилища, она проходит сама.
 * Ошибка кодирования повторится и на второй попытке, зато её текст останется в
 * истории задач и в поле «Причина ошибки» у медиафайла.
 */
export const BuildHlsTask: TaskConfig<'build-hls'> = {
  slug: 'build-hls',
  retries: 2,
  inputSchema: [{ name: 'mediaId', type: 'text', required: true }],
  outputSchema: [
    { name: 'files', type: 'number' },
    { name: 'durationSeconds', type: 'number' },
  ],
  handler: async ({ input, req }) => {
    const mediaId = String((input as { mediaId?: string | number })?.mediaId ?? '');
    if (!mediaId) throw new Error('Не передан медиафайл для нарезки.');

    const markFailed = async (message: string): Promise<void> => {
      // Состояние пишем прямо в медиафайл: человек в админке смотрит на видео,
      // а не в список фоновых задач, и «Ошибка» с причиной должна быть видна там.
      await req.payload.update({
        collection: 'media',
        id: mediaId,
        data: { hls: { status: 'failed', error: message.slice(0, 2000) } },
        context: { skipHlsQueue: true },
      });
    };

    try {
      await req.payload.update({
        collection: 'media',
        id: mediaId,
        data: { hls: { status: 'processing', error: null } },
        context: { skipHlsQueue: true },
      });

      const summary = await buildHls({
        ports: defaultVideoPorts(req.payload),
        mediaId,
        // Адрес обязан совпадать с эндпоинтом выдачи: он попадает в плейлист
        // как есть, и по нему же загрузчик плеера узнаёт запрос ключа.
        keyUri: `${process.env['PAYLOAD_PUBLIC_SERVER_URL'] ?? ''}/api/video/${mediaId}/envelope`,
        logger: (m) => req.payload.logger.info(`[task:build-hls] ${m}`),
      });

      return {
        output: {
          files: summary.files,
          durationSeconds: summary.durationSeconds ?? 0,
        },
      };
    } catch (error) {
      await markFailed(error instanceof Error ? error.message : String(error));
      throw error;
    }
  },
};
