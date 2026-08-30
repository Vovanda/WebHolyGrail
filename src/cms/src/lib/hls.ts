import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { renameSync, watch, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { periodKey } from './video/crypto-period';

/**
 * Нарезка видео в HLS: лесенка качеств и мастер-плейлист.
 *
 * @remarks
 * Зачем вообще нарезать, если браузер играет и обычный mp4: mp4 отдаётся одним
 * файлом в одном качестве. На телефоне в поле это либо долгая загрузка видео
 * в 1080p, либо мыло для всех, а перемотка тянет файл целиком. HLS отдаёт
 * короткие сегменты и несколько дорожек — плеер сам переключается по скорости
 * канала, зритель может выбрать качество руками, а перемотка стоит одного
 * сегмента.
 *
 * Кодирует `ffmpeg` — системная утилита из образа, а не npm-обёртка: обёртки
 * ломаются на каждом обновлении, а плейлист ключей ffmpeg стабилен годами.
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
 * заметит. Лестница настраивается владельцем в настройках сайта.
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
 * Берём с запасом: если у видео частота ниже, ключевой кадр всё равно попадёт
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
   * Кадр из видео — обложка до нажатия «play».
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
  /** Длительность видео в секундах, если ffprobe её отдал. */
  readonly durationSeconds: number | null;
  /** Секрет AES-128. Хранить в базе, в раздачу не класть. */
  readonly secret: Buffer;
  /**
   * Сколько частей шло под одним ключом; `null` — вся запись под одним.
   *
   * @remarks
   * Хранится у записи и служит признаком: у неё есть криптопериоды, значит запрос ключа
   * без номера криптопериодовы отклоняется, и секрет наружу не уходит никогда.
   */
  readonly cryptoPeriod: number | null;
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
 * вместо 1080, иначе HD-видео остался бы без HD-ступени.
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

/**
 * Высота, длительность и наличие звука; `null` — если ffprobe не смог прочитать.
 *
 * @remarks
 * Звук приходится знать заранее: карта дорожек перечисляет их поимённо, и
 * запись без звука с картой `v:0,a:0` роняет нарезку целиком - муксер отвечает
 * «Variant stream info update failed». Немое видео обычное дело: съёмка
 * с квадрокоптера, ускоренная запись, стоковый ролик.
 */
async function probe(
  input: string,
): Promise<{ height: number | null; duration: number | null; hasAudio: boolean }> {
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

    const audio = await run('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'a',
      '-show_entries',
      'stream=codec_type',
      '-of',
      'csv=p=0',
      input,
    ]).catch(() => '');

    return {
      height: height ? Number(height) : null,
      duration: duration ? Math.round(Number(duration)) : null,
      hasAudio: audio.trim().length > 0,
    };
  } catch {
    return { height: null, duration: null, hasAudio: false };
  }
}

/**
 * Режет видео на HLS и возвращает файлы для заливки в хранилище.
 *
 * @param source - исходный файл целиком. Видео уже лежит в хранилище, но
 * ffmpeg нужен локальный путь, поэтому пишем во временную папку и убираем её
 * в `finally` — иначе диск кончится за десяток видео.
 * @param options.keyUri - адрес, по которому плеер запросит ключ. Попадает в
 * плейлист как есть; сам ключ в раздачу не кладётся никогда.
 */
export async function transcodeToHls(
  source: Buffer,
  {
    ladder = DEFAULT_LADDER,
    keyUri,
    cryptoPeriod = null,
    onProgress,
  }: {
    ladder?: ReadonlyArray<HlsRung>;
    keyUri: string;
    /**
     * Сколько частей идёт под одним ключом.
     *
     * @remarks
     * `null` - вся запись под одним ключом, как было до появления криптопериодов.
     *
     * Величина приблизительная: муксер перечитывает файл ключа, уже начав
     * очередную часть, поэтому граница приходится на часть позже задуманного.
     * Точность здесь и не нужна - это мера того, что отдаёт утёкший ключ, -
     * а вот номер криптопериодовы в адресе точен всегда: его пишет сам муксер там, где
     * ключ сменился на самом деле.
     */
    cryptoPeriod?: number | null;
    /**
     * Сколько записи уже обработано, от нуля до единицы.
     *
     * @remarks
     * Нарезка часовой записи идёт минутами, и без вестей о ней карточка
     * выглядит зависшей: владелец не понимает, идёт работа или всё встало.
     */
    onProgress?: (share: number) => void;
  },
): Promise<HlsResult> {
  if (!keyUri) {
    throw new Error('Нужен адрес выдачи ключа: без него плеер не расшифрует поток.');
  }

  const work = await mkdtemp(join(tmpdir(), 'whg-hls-'));
  try {
    const input = join(work, 'source');
    await writeFile(input, source);

    const { height: sourceHeight, duration, hasAudio } = await probe(input);
    const rungs = selectRungs(ladder, sourceHeight);

    const secret = randomBytes(16);
    const keyFile = join(work, 'enc.key');
    const keyInfo = join(work, 'enc.keyinfo');

    const split = typeof cryptoPeriod === 'number' && cryptoPeriod >= 1;

    /*
      Формат keyinfo: адрес для плеера, локальный файл ключа, вектор.

      У записи с криптопериодми ключ меняется по ходу: на границе сюда кладётся ключ
      следующей криптопериодовы и адрес с её номером. Муксер перечитывает файл сам, а
      номер попадает в манифест ровно там, где ключ сменился, - поэтому выдаче
      не приходится вычислять границу, она берёт номер из запроса.

      Свой вектор на криптопериодову обязателен: одинаковый вектор при одинаковом ключе
      выдаёт повторы.
    */
    const putPeriod = (period: number): void => {
      // У каждой криптопериодовы свой файл ключа, и прежний не переписывается: муксер
      // читает его когда сам решит, и подмена под ним отдала бы половину
      // старого ключа с половиной нового.
      const periodFile = split ? `${keyFile}.${period}` : keyFile;
      writeFileSync(periodFile, split ? periodKey(secret, period) : secret);

      /*
        Сам keyinfo подменяем переименованием: запись на месте муксер иногда
        застаёт на середине, и нарезка падает на невнятной ошибке.

        Windows переименовать поверх открытого файла не даёт, и муксер держит
        keyinfo открытым ровно в момент чтения. Поэтому несколько попыток,
        а если система так и не пустила - пишем на месте: это возвращает
        прежний риск, но он меньше, чем оборванная нарезка.
      */
      const uri = split ? `${keyUri}?p=${period}` : keyUri;
      const line = `${uri}\n${periodFile}\n${randomBytes(16).toString('hex')}\n`;
      const draft = `${keyInfo}.${period}`;
      writeFileSync(draft, line);

      for (let attempt = 0; ; attempt += 1) {
        try {
          renameSync(draft, keyInfo);
          return;
        } catch {
          if (attempt >= 20) break;
        }
      }
      writeFileSync(keyInfo, line);
    };

    putPeriod(0);

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
        // Дорожку звука берём только когда она есть: карта ниже перечисляет
        // дорожки поимённо, и обещанная, но отсутствующая роняет нарезку.
        ...(hasAudio ? ['-map', '0:a:0'] : []),
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
        ...(hasAudio ? [`-c:a:${index}`, 'aac', `-b:a:${index}`, `${rung.audioKbps}k`] : []),
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
      ...(hasAudio ? ['-ac', '2'] : []),
      '-var_stream_map',
      rungs
        .map(
          (rung, index) =>
            `${hasAudio ? `v:${index},a:${index}` : `v:${index}`},name:${rung.height}p`,
        )
        .join(' '),
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
      // Перечитывать файл ключа муксер соглашается только с этим признаком.
      // Признак обязан стоять до имени выходного файла: всё, что идёт после
      // него, к этому выходу уже не относится и молча пропадает.
      ...(split ? ['-hls_flags', 'periodic_rekey'] : []),
      '-hls_segment_filename',
      join(out, '%v', 'seg_%05d.ts'),
      join(out, '%v', 'index.m3u8'),
    );

    // Папки под каждую дорожку ffmpeg сам не создаёт — только пишет в них.
    await Promise.all(
      rungs.map((rung) => mkdir(join(out, `${rung.height}p`), { recursive: true })),
    );

    /*
      Границу криптопериодовы отмеряем по частям, которые муксер уже написал: по времени
      этого не сделать - кодирование идёт не в темпе записи, у короткой оно
      быстрее реального времени, у тяжёлой медленнее.

      Считаем по одной дорожке, иначе счёт умножился бы на число качеств.
      Остальные дорожки сменят ключ примерно там же, и разойтись им не страшно:
      номер криптопериодовы берётся из манифеста каждой дорожки отдельно.
    */
    const counted = rungs[0] ? `${rungs[0].height}p` : null;
    const seen = new Set<string>();
    let period = 0;

    const watcher =
      split && counted
        ? watch(join(out, counted), (_event, name) => {
            if (!name || !String(name).endsWith('.ts')) return;
            const file = String(name);
            if (seen.has(file)) return;
            seen.add(file);
            if (seen.size % (cryptoPeriod as number) !== 0) return;
            // Запись синхронная, и это здесь важно: муксер перечитывает файл
            // между частями, а отложенная запись успевала бы к концу нарезки -
            // ключ не менялся бы вовсе.
            putPeriod((period += 1));
          })
        : null;

    try {
      await run('ffmpeg', args, (seconds) => {
        // Доля считается от длительности: без неё показывать нечего, и вести о
        // ходе просто не идут.
        if (!onProgress || !duration || duration <= 0) return;
        onProgress(Math.min(1, seconds / duration));
      });
    } finally {
      watcher?.close();
    }

    return {
      files: await collect(out),
      rungs,
      durationSeconds: duration,
      secret,
      cryptoPeriod: split ? (cryptoPeriod as number) : null,
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
 * Берём из середины видео, а не с первой секунды: начало часто чёрное или
 * с наплывом, и обложкой становится пустой кадр.
 *
 * Сбой здесь не должен ронять всю нарезку: видео уже готов, а обложку можно
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

/**
 * Запуск утилиты со сбором stdout; отказ - с текстом stderr, иначе причину не найти.
 *
 * @remarks
 * Ход работы отдаётся наблюдателю по мере разбора вывода: нарезка часовой
 * записи идёт минутами, и без вестей о ней карточка выглядит зависшей.
 */
function run(
  command: string,
  args: ReadonlyArray<string>,
  onProgress?: (seconds: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args]);
    let out = '';
    let err = '';
    child.stdout.on('data', (chunk) => {
      out += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      const text = String(chunk);
      err += text;
      if (onProgress) {
        const at = lastTimestamp(text);
        if (at !== null) onProgress(at);
      }
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${command} завершился с кодом ${code}: ${err.slice(-2000)}`));
    });
  });
}

/**
 * Последняя отметка времени в выводе утилиты.
 *
 * @remarks
 * Утилита пишет строки вида `time=00:01:23.45`, обновляя их по ходу работы.
 * Берём последнюю в куске вывода: промежуточные всё равно устарели к моменту
 * разбора.
 */
function lastTimestamp(text: string): number | null {
  const matches = [...text.matchAll(/time=(\d+):(\d{2}):(\d{2})/g)];
  const last = matches.at(-1);
  if (!last) return null;
  const [, h, m, sec] = last;
  return Number(h) * 3600 + Number(m) * 60 + Number(sec);
}
