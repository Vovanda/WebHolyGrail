import { randomUUID } from 'node:crypto';

import type { VideoPorts, StoryboardRendition } from './ports';

/**
 * Готовит загруженное видео к показу: режет на качества и кладёт раздачу
 * в хранилище.
 *
 * @remarks
 * От человека в админке не требуется ничего, кроме «выбрать файл»: сценарий
 * запускается сам, из фоновой задачи. Кодирование видео занимает минуты —
 * держать столько открытым соединение загрузки нельзя.
 *
 * Сценарий работает через порты и ничего не знает ни про ffmpeg, ни про S3,
 * ни про Payload. Благодаря этому порядок действий — в первую очередь тот,
 * при котором оригинал удаляется последним — проверяется тестом без базы,
 * бакета и кодировщика.
 *
 * Идемпотентен: повторный прогон стирает прошлую нарезку и кладёт новую.
 * Это важно, потому что задача перезапускается после сбоя, а остатки прежних
 * сегментов ломают плейлист.
 */
export interface BuildHlsArgs {
  readonly ports: VideoPorts;
  readonly mediaId: string | number;
  /** Адрес выдачи ключа — попадает в плейлист как есть. */
  readonly keyUri: string;
  readonly logger?: (message: string) => void;
}

export interface BuildHlsSummary {
  readonly qualities: ReadonlyArray<number>;
  readonly files: number;
  readonly durationSeconds: number | null;
}

export async function buildHls({
  ports,
  mediaId,
  keyUri,
  logger,
}: BuildHlsArgs): Promise<BuildHlsSummary> {
  const log = logger ?? (() => {});
  const { encoder, storage, catalog } = ports;

  const video = await catalog.read(mediaId);
  if (!video.mimeType.startsWith('video/')) {
    throw new Error(`Медиафайл ${mediaId} — не видео (${video.mimeType || 'тип неизвестен'}).`);
  }
  if (!video.url) throw new Error(`У медиафайла ${mediaId} нет адреса файла.`);

  log(`забираю исходник: ${video.filename ?? video.url}`);
  const source = await storage.readSource(video.url);

  // Область хранения — по автору, дальше случайный адрес. Область даёт
  // границу: удалить всё хозяйство участника или посчитать занятое им место —
  // это один префикс, а не обход базы. Ключом идёт номер, а не имя канала:
  // переименование иначе потребовало бы перекладывать сегменты.
  //
  // Внутри области адрес случайный: по номеру медиафайла путь к сегментам
  // собирался бы перебором.
  const area = video.ownerId ? `u${video.ownerId}` : 'shared';
  const prefix = `${area}/hls/${randomUUID()}`;

  log('режу на качества');

  /*
    Ход нарезки пишем редко - шагом в несколько процентов. Карточке этого
    хватает, а запись в базу на каждый разобранный кадр нагружала бы её впустую.
  */
  let lastReported = 0;
  const result = await encoder.transcode(source, {
    ladder: await catalog.ladder(),
    keyUri,
    onProgress: (share) => {
      const percent = Math.round(share * 100);
      if (percent < lastReported + 5) return;
      lastReported = percent;
      void catalog.saveProgress(mediaId, percent);
    },
  });

  // Прошлую нарезку убираем по адресу из каталога, а не по новому: у каждой
  // свой адрес, и иначе прежние сегменты остались бы в хранилище навсегда.
  if (video.previousPrefix) await storage.removeFolder(video.previousPrefix);

  for (const file of result.files) {
    await storage.put(`${prefix}/${file.path}`, file);
  }
  log(`залито файлов: ${result.files.length}`);

  // Оригинал удаляется последним и только дойдя сюда: если нарезка или заливка
  // упали, файл остаётся на месте и задачу можно перезапустить. Дальше он не
  // нужен — смотрят через плейлист, а гигабайтный mp4 занимает больше места,
  // чем обе ступени вместе.
  const sourceKey = storage.keyFromUrl(video.url);
  if (sourceKey) {
    await storage.remove(sourceKey);
    log(`исходник удалён, остаётся только нарезка: ${sourceKey}`);
  }

  /*
    Лента кадров кладётся рядом с нарезкой, а не в медиатеку: её показывает
    полоса времени, редактору она не нужна, и в списке файлов была бы мусором.
    Заодно она уходит в раздачу и кешируется как остальные части записи.
  */
  let storyboard: StoryboardRendition | null = null;
  if (result.storyboard) {
    const key = `${prefix}/storyboard.jpg`;
    await storage.put(key, {
      path: 'storyboard.jpg',
      body: result.storyboard.image,
      contentType: 'image/jpeg',
    });
    storyboard = {
      url: storage.urlForKey(key),
      columns: result.storyboard.columns,
      rows: result.storyboard.rows,
      count: result.storyboard.count,
      frameWidth: result.storyboard.frameWidth,
      frameHeight: result.storyboard.frameHeight,
      intervalSeconds: result.storyboard.intervalSeconds,
    };
    log('кадры для перемотки сняты');
  }

  await catalog.saveRendition(mediaId, {
    storyboard,
    playlistUrl: storage.urlForKey(`${prefix}/master.m3u8`),
    prefix,
    qualities: result.rungs.map((rung) => rung.height),
    durationSeconds: result.durationSeconds,
    // Секрет хранится в каталоге и отдаётся только через эндпоинт, который
    // решает, кому можно. В раздачу он не попадает никогда.
    secret: result.secret.toString('base64'),
  });

  // Обложку ставим только если редактор не задал свою: его кадр важнее
  // автоматически выбранного.
  if (result.poster && !video.hasPoster) {
    await catalog.savePoster(mediaId, result.poster);
    log('обложка снята из видео');
  }

  return {
    qualities: result.rungs.map((rung) => rung.height),
    files: result.files.length,
    durationSeconds: result.durationSeconds,
  };
}
