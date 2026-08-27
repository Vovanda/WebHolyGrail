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
  /**
   * Кадр из ролика — обложка до нажатия «play».
   *
   * @remarks
   * Снимается тем же проходом: отдельная утилита ради одного кадра не нужна.
   * `null` — если кадр вытащить не удалось; тогда обложку задаёт редактор,
   * а плеер обходится без неё.
   */
  readonly poster: Buffer | null;
  /**
   * Лента кадров для перемотки: все кадры одной картинкой.
   *
   * @remarks
   * Полоса без кадров - перемотка вслепую. Кадры снимаются той же обработкой
   * и складываются в одно изображение: сотня отдельных картинок означала бы
   * сотню запросов на каждую перемотку.
   *
   * `null` - если снять не удалось; плеер тогда обходится полосой без
   * подсказок.
   */
  readonly storyboard: StoryboardResult | null;
  /** Ступени, которые реально собрались (без тех, что выше исходника). */
  readonly rungs: ReadonlyArray<HlsRung>;
  /** Длительность ролика в секундах, если ffprobe её отдал. */
  readonly durationSeconds: number | null;
  /** Секрет AES-128. Хранить в базе, в раздачу не класть. */
  readonly secret: Buffer;
}

/** Лента кадров и её устройство: по нему собирается разметка для плеера. */
export interface StoryboardResult {
  readonly image: Buffer;
  /** Сколько кадров в ряду и всего: по ним считается положение каждого. */
  readonly columns: number;
  readonly rows: number;
  readonly count: number;
  /** Размер одного кадра. */
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** Сколько секунд приходится на кадр. */
  readonly intervalSeconds: number;
}

/**
 * Ступени, которые имеет смысл собирать для исходника такой высоты.
 *
 * @remarks
 * Выше исходника не поднимаемся: апскейл раздувает файлы и не добавляет ни
 * пикселя детализации. Допуск в 10% — на нестандартную высоту вроде 1088
 * вместо 1080, иначе HD-ролик остался бы без HD-ступени.
 *
 * Если не подошла ни одна (вертикальное видео с телефона, крошечный экран),
 * берём нижнюю: без единой дорожки плеер не получит ничего.
 */
/** Ширина кадра подсказки: их показывают размером с ноготь. */
const STORYBOARD_FRAME_WIDTH = 160;

/** Потолок числа кадров: дальше лента тяжелеет, а толку не прибавляется. */
const MAX_STORYBOARD_FRAMES = 100;

export function selectRungs(
  ladder: ReadonlyArray<HlsRung>,
  sourceHeight: number | null,
): ReadonlyArray<HlsRung> {
  const fitting = sourceHeight ? ladder.filter((r) => r.height <= sourceHeight * 1.1) : [...ladder];
  return fitting.length > 0 ? fitting : [ladder[0]!];
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
    const rungs = selectRungs(ladder, sourceHeight);

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
      poster: await grabPoster(input, work, duration),
      storyboard: await grabStoryboard(input, work, duration),
    };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/**
 * Собирает готовую раздачу: мастер-плейлист в корне, дорожки по папкам.
 *
 * @remarks
 * Пути внутри плейлистов нормализуются: ffmpeg подставляет в них разделитель
 * своей системы, и на Windows мастер-плейлист получает `480p\index.m3u8`.
 * В адресе это обычный символ, а не разделитель, поэтому плеер такую дорожку
 * не найдёт. В Linux-контейнере проблема не проявляется — тем она и опасна:
 * ломается только у того, кто разрабатывает под Windows.
 */
async function collect(root: string): Promise<HlsFile[]> {
  const files: HlsFile[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      for (const name of await readdir(join(root, entry.name))) {
        files.push({
          path: `${entry.name}/${name}`,
          body: normalizePlaylist(name, await readFile(join(root, entry.name, name))),
          contentType: contentTypeOf(name),
        });
      }
    } else {
      files.push({
        path: entry.name,
        body: normalizePlaylist(entry.name, await readFile(join(root, entry.name))),
        contentType: contentTypeOf(entry.name),
      });
    }
  }
  return files;
}

const contentTypeOf = (name: string): string =>
  name.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t';

/** Приводит разделители путей внутри плейлиста к тем, что понимает плеер. */
function normalizePlaylist(name: string, body: Buffer): Buffer {
  if (!name.endsWith('.m3u8')) return body;
  return Buffer.from(body.toString('utf8').split('\\').join('/'), 'utf8');
}

/**
 * Снимает кадр для обложки.
 *
 * @remarks
 * Берём из середины ролика, а не с первой секунды: начало часто чёрное или
 * с наплывом, и обложкой становится пустой кадр.
 *
 * Сбой здесь не должен ронять всю нарезку: ролик уже готов, а обложку можно
 * задать руками.
 */
/**
 * Лента кадров для перемотки.
 *
 * @remarks
 * Кадры берутся через равные промежутки и складываются в одну картинку сеткой.
 * Промежуток считается от длительности: у короткой записи кадры чаще, у часовой
 * реже, и лента остаётся одного порядка по весу.
 *
 * Кадры мелкие: их показывают размером с ноготь над полосой времени, и большие
 * только утяжеляют картинку.
 *
 * Сбой здесь не роняет нарезку: запись уже готова, а перемотка работает и без
 * подсказок.
 */
async function grabStoryboard(
  input: string,
  work: string,
  duration: number | null,
): Promise<StoryboardResult | null> {
  if (!duration || duration < 10) return null;

  const count = Math.min(MAX_STORYBOARD_FRAMES, Math.max(10, Math.floor(duration / 5)));
  const intervalSeconds = duration / count;
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const file = join(work, 'storyboard.jpg');

  try {
    await run('ffmpeg', [
      '-y',
      '-i',
      input,
      '-vf',
      `fps=1/${intervalSeconds.toFixed(3)},scale=${STORYBOARD_FRAME_WIDTH}:-2,tile=${columns}x${rows}`,
      '-frames:v',
      '1',
      '-q:v',
      '5',
      file,
    ]);

    const image = await readFile(file);
    return {
      image,
      columns,
      rows,
      count,
      frameWidth: STORYBOARD_FRAME_WIDTH,
      // Пропорции исходника здесь неизвестны, поэтому берём привычные: плеер
      // растягивает подсказку по своей рамке, и небольшая разница незаметна.
      frameHeight: Math.round((STORYBOARD_FRAME_WIDTH * 9) / 16),
      intervalSeconds,
    };
  } catch {
    return null;
  }
}

async function grabPoster(
  input: string,
  work: string,
  duration: number | null,
): Promise<Buffer | null> {
  const at = duration && duration > 2 ? Math.floor(duration / 2) : 0;
  const file = join(work, 'poster.jpg');
  try {
    await run('ffmpeg', [
      '-y',
      '-ss',
      String(at),
      '-i',
      input,
      '-frames:v',
      '1',
      '-vf',
      'scale=1280:-2',
      '-q:v',
      '3',
      file,
    ]);
    return await readFile(file);
  } catch {
    return null;
  }
}

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
