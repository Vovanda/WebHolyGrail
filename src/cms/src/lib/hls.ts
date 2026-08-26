import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * Нарезка видео в HLS: лесенка качеств и мастер-плейлист.
 *
 * @remarks
 * Зачем вообще нарезать, если браузер играет и обычный mp4: mp4 отдаётся одним
 * файлом в одном качестве. На телефоне в поле это либо долгая загрузка ролика
 * в 1080p, либо мыло для всех, а перемотка тянет файл целиком. HLS отдаёт
 * короткие сегменты и несколько дорожек — плеер сам переключается по скорости
 * канала, зритель может выбрать качество руками, а перемотка стоит одного
 * сегмента.
 *
 * Кодирует `ffmpeg` — системная утилита из образа, а не npm-обёртка: обёртки
 * ломаются на каждом обновлении, а набор ключей ffmpeg стабилен годами.
 *
 * Шифрование включено всегда, независимо от того, открытое видео или закрытое.
 * Публичность — это политика выдачи ключа, а не способ хранения: так режим
 * переключается в обе стороны мгновенно, без повторного кодирования.
 */

/** Одна ступень лесенки качеств. */
export interface HlsRung {
  /** Высота кадра. Ширина считается от исходного соотношения сторон. */
  readonly height: number;
  /** Битрейт видео, кбит/с. */
  readonly videoKbps: number;
  /** Битрейт звука, кбит/с. */
  readonly audioKbps: number;
}

/**
 * Лесенка по умолчанию: 480p и HD.
 *
 * @remarks
 * Ступени идут снизу вверх: плеер начинает с нижней и поднимается, увидев
 * запас по каналу — так первый кадр появляется быстрее, чем при старте сверху.
 *
 * Двух хватает: 480p вытягивает мобильный интернет на объекте, HD закрывает
 * остальное. Каждая лишняя ступень — это ещё одна дорожка в том же проходе и
 * место в хранилище, а разницу между 720p и 1080p на телефоне почти никто не
 * заметит. Набор настраивается владельцем в настройках сайта.
 */
export const DEFAULT_LADDER: ReadonlyArray<HlsRung> = [
  { height: 480, videoKbps: 1200, audioKbps: 96 },
  { height: 720, videoKbps: 2800, audioKbps: 128 },
];

/** Длина сегмента в секундах. */
const SEGMENT_SECONDS = 4;

/**
 * Частота кадров, из которой считается интервал ключевых кадров.
 *
 * @remarks
 * Берём с запасом: если у ролика частота ниже, ключевой кадр всё равно попадёт
 * на границу сегмента, а если выше — интервал окажется кратным, что тоже
 * годится. Точное значение исходника здесь не нужно.
 */
const ASSUMED_FPS = 30;

export interface HlsFile {
  /** Путь относительно корня раздачи: `master.m3u8`, `720p/seg_00001.ts`, … */
  readonly path: string;
  readonly body: Buffer;
  readonly contentType: string;
}

export interface HlsResult {
  readonly files: ReadonlyArray<HlsFile>;
  /** Ступени, которые реально собрались (без тех, что выше исходника). */
  readonly rungs: ReadonlyArray<HlsRung>;
  /** Длительность ролика в секундах, если ffprobe её отдал. */
  readonly durationSeconds: number | null;
  /** Секрет AES-128. Хранить в базе, в раздачу не класть. */
  readonly secret: Buffer;
}

/** Высота и длительность исходника; `null` — если ffprobe не смог прочитать. */
async function probe(input: string): Promise<{ height: number | null; duration: number | null }> {
  try {
    const out = await run('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=height',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=0',
      input,
    ]);
    const height = /height=(\d+)/.exec(out)?.[1];
    const duration = /duration=([\d.]+)/.exec(out)?.[1];
    return {
      height: height ? Number(height) : null,
      duration: duration ? Math.round(Number(duration)) : null,
    };
  } catch {
    return { height: null, duration: null };
  }
}

/**
 * Режет видео на HLS и возвращает файлы для заливки в хранилище.
 *
 * @param source - исходный файл целиком. Видео уже лежит в хранилище, но
 * ffmpeg нужен локальный путь, поэтому пишем во временную папку и убираем её
 * в `finally` — иначе диск кончится за десяток роликов.
 * @param options.keyUri - адрес, по которому плеер запросит ключ. Попадает в
 * плейлист как есть; сам ключ в раздачу не кладётся никогда.
 */
export async function transcodeToHls(
  source: Buffer,
  { ladder = DEFAULT_LADDER, keyUri }: { ladder?: ReadonlyArray<HlsRung>; keyUri: string },
): Promise<HlsResult> {
  if (!keyUri) {
    throw new Error('Нужен адрес выдачи ключа: без него плеер не расшифрует поток.');
  }

  const work = await mkdtemp(join(tmpdir(), 'whg-hls-'));
  try {
    const input = join(work, 'source');
    await writeFile(input, source);

    const { height: sourceHeight, duration } = await probe(input);
    // Ступени выше исходника не создаём: апскейл раздувает файлы и не
    // добавляет ни пикселя детализации. Небольшой допуск — на случай
    // нестандартной высоты вроде 1088 вместо 1080.
    const fitting = sourceHeight
      ? ladder.filter((r) => r.height <= sourceHeight * 1.1)
      : [...ladder];
    const rungs = fitting.length > 0 ? fitting : [ladder[0]!];

    const secret = randomBytes(16);
    const keyFile = join(work, 'enc.key');
    await writeFile(keyFile, secret);
    const keyInfo = join(work, 'enc.keyinfo');
    // Формат keyinfo: адрес для плеера, локальный файл ключа, вектор.
    await writeFile(keyInfo, `${keyUri}\n${keyFile}\n${randomBytes(16).toString('hex')}\n`);

    const out = join(work, 'out');
    await mkdir(out, { recursive: true });

    // Один проход на все ступени. Раньше здесь был цикл с отдельным запуском
    // ffmpeg на каждое качество: исходник декодировался столько раз, сколько
    // ступеней, а мастер-плейлист приходилось клеить руками. `-var_stream_map`
    // делает и то, и другое штатно.
    const args: string[] = ['-y', '-i', input];

    rungs.forEach((rung, index) => {
      const keyframes = SEGMENT_SECONDS * ASSUMED_FPS;
      args.push(
        '-map',
        '0:v:0',
        '-map',
        '0:a:0?',
        // Чётная ширина обязательна для H.264 — на нечётной кодек падает.
        `-filter:v:${index}`,
        `scale=-2:${rung.height}`,
        `-c:v:${index}`,
        'libx264',
        `-profile:v:${index}`,
        'main',
        `-b:v:${index}`,
        `${rung.videoKbps}k`,
        `-maxrate:v:${index}`,
        `${Math.round(rung.videoKbps * 1.07)}k`,
        `-bufsize:v:${index}`,
        `${rung.videoKbps * 2}k`,
        `-c:a:${index}`,
        'aac',
        `-b:a:${index}`,
        `${rung.audioKbps}k`,
        `-g:v:${index}`,
        String(keyframes),
        `-keyint_min:v:${index}`,
        String(keyframes),
      );
    });

    args.push(
      '-preset',
      'veryfast',
      // Ключевой кадр ровно на границе сегмента: без этого перемотка и смена
      // качества идут рывком — плеер вынужден ждать следующего кадра.
      '-sc_threshold',
      '0',
      '-ac',
      '2',
      '-var_stream_map',
      rungs.map((rung, index) => `v:${index},a:${index},name:${rung.height}p`).join(' '),
      '-master_pl_name',
      'master.m3u8',
      '-f',
      'hls',
      '-hls_time',
      String(SEGMENT_SECONDS),
      '-hls_playlist_type',
      'vod',
      '-hls_key_info_file',
      keyInfo,
      '-hls_segment_filename',
      join(out, '%v', 'seg_%05d.ts'),
      join(out, '%v', 'index.m3u8'),
    );

    // Папки под каждую дорожку ffmpeg сам не создаёт — только пишет в них.
    await Promise.all(
      rungs.map((rung) => mkdir(join(out, `${rung.height}p`), { recursive: true })),
    );

    await run('ffmpeg', args);

    return {
      files: await collect(out),
      rungs,
      durationSeconds: duration,
      secret,
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/** Собирает готовую раздачу: мастер-плейлист в корне, дорожки по папкам. */
async function collect(root: string): Promise<HlsFile[]> {
  const files: HlsFile[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const name of await readdir(join(root, entry.name))) {
        files.push({
          path: `${entry.name}/${name}`,
          body: await readFile(join(root, entry.name, name)),
          contentType: contentTypeOf(name),
        });
      }
    } else {
      files.push({
        path: entry.name,
        body: await readFile(join(root, entry.name)),
        contentType: contentTypeOf(entry.name),
      });
    }
  }
  return files;
}

const contentTypeOf = (name: string): string =>
  name.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';

/** Запуск утилиты со сбором stdout; отказ — с текстом stderr, иначе причину не найти. */
function run(command: string, args: ReadonlyArray<string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args]);
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => {
      out += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      err += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${command} завершился с кодом ${code}: ${err.slice(-2000)}`));
    });
  });
}
