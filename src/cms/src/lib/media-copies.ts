/**
 * Копии файла: что лежит в хранилище и что останется после уборки.
 *
 * @remarks
 * Здесь нет ни сети, ни базы, ни хранилища - только разбор записи и счёт,
 * поэтому всё это проверяется без запуска CMS. Удаляет файлы и пишет запись
 * тот, кто вызвал; его дело - выполнить решение, а не принять его.
 */

/** Одна копия файла: ступень нарезки или сам оригинал. */
export interface Copy {
  /** Имя ступени; у файла самой записи пусто. */
  readonly step: string;
  /**
   * Это исходный файл, а не копия.
   *
   * @remarks
   * После удаления оригинала файлом записи становится самая крупная копия.
   * Полями она от исходника неотличима, поэтому признак берётся из пометки
   * записи: выдавать копию за оригинал нельзя - человек решит, что исходник
   * на месте, и удалит следующую копию как лишнюю.
   */
  readonly source: boolean;
  readonly filename: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly original: boolean;
}

export interface CopyRole {
  readonly name: string;
  readonly removeLabel: string;
}

/**
 * Роль строки в перечне копий.
 *
 * @remarks
 * Название строки и подпись её кнопки берутся из одного места: у строки
 * оригинала кнопка «Удалить копию» обещала не то, что делала, и владелец
 * убирал исходник, думая, что убирает копию.
 */
export function copyRole(copy: Pick<Copy, 'step' | 'source' | 'original'>): CopyRole {
  if (copy.original && copy.source) return { name: 'Оригинал', removeLabel: 'Удалить оригинал' };
  if (copy.original) return { name: 'Самая крупная копия', removeLabel: 'Удалить файл' };
  return { name: copy.step, removeLabel: 'Удалить копию' };
}

/** Запись медиатеки в той части, что касается копий. */
export interface MediaRecord {
  /** Папка хранилища, в которой лежит файл и его копии. */
  readonly prefix?: string | null;
  /** Оригинал удалён, и файлом записи стала одна из копий. */
  readonly originalDropped?: boolean | null;
  readonly filename?: string | null;
  readonly url?: string | null;
  readonly filesize?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
  readonly sizes?: Record<string, SizeRecord | null | undefined> | null;
}

interface SizeRecord {
  readonly filename?: string | null;
  readonly url?: string | null;
  readonly filesize?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
}

/**
 * Все копии файла, от мелкой к крупной, оригинал последним.
 *
 * @remarks
 * Пустые ступени пропускаются: у видео и документов нарезки нет вовсе,
 * а у картинки ступень крупнее оригинала не создаётся - место под неё
 * в записи есть, а файла за ним нет.
 */
export function copiesOf(doc: MediaRecord): Copy[] {
  const steps = Object.entries(doc.sizes ?? {})
    .filter(([, size]) => Boolean(size?.filename))
    .map(([step, size]) => ({
      step,
      filename: size?.filename ?? '',
      url: size?.url ?? '',
      width: size?.width ?? 0,
      height: size?.height ?? 0,
      bytes: size?.filesize ?? 0,
      original: false,
      source: false,
    }));

  const original: Copy[] = doc.filename
    ? [
        {
          step: '',
          filename: doc.filename,
          url: doc.url ?? '',
          width: doc.width ?? 0,
          height: doc.height ?? 0,
          bytes: doc.filesize ?? 0,
          original: true,
          source: !doc.originalDropped,
        },
      ]
    : [];

  return [...steps.sort((a, b) => a.width - b.width), ...original];
}

/** Сколько всего весят копии файла. */
export function totalBytes(doc: MediaRecord): number {
  return copiesOf(doc).reduce((sum, copy) => sum + copy.bytes, 0);
}

/**
 * Что станет с записью, если убрать эту копию.
 *
 * @remarks
 * Ступень просто уходит из перечня. С оригиналом иначе: его место занимает
 * самая крупная из оставшихся ступеней - она перестаёт быть ступенью и
 * становится самим файлом. Иначе запись осталась бы без файла, и всё, что
 * на неё ссылается, показывало бы пустоту.
 *
 * Вместе с заменой запись получает пометку `originalDropped`: по полям
 * наследника от исходника не отличить, а админка должна знать, что
 * оригинала больше нет.
 *
 * Убрать последнюю копию нельзя: файл, у которого не осталось ни одного
 * изображения, - это сломанная запись, а не сэкономленное место.
 */
export function withoutCopy(
  doc: MediaRecord,
  step: string,
): { ok: false; why: string } | { ok: true; drop: string; patch: Record<string, unknown> } {
  const copies = copiesOf(doc);
  const target = copies.find((copy) => copy.step === step);
  if (!target) return { ok: false, why: 'Такой копии у файла нет' };
  if (copies.length < 2) return { ok: false, why: 'Это единственная копия файла' };

  if (!target.original) {
    return {
      ok: true,
      drop: target.filename,
      patch: { sizes: { [step]: emptySize() } },
    };
  }

  const heir = copies.filter((copy) => !copy.original).at(-1);
  if (!heir) return { ok: false, why: 'Заменить оригинал нечем: ступеней нет' };

  const size = doc.sizes?.[heir.step];
  return {
    ok: true,
    drop: target.filename,
    patch: {
      filename: heir.filename,
      url: heir.url,
      filesize: heir.bytes,
      width: size?.width ?? null,
      height: size?.height ?? null,
      mimeType: size?.mimeType ?? doc.mimeType ?? null,
      sizes: { [heir.step]: emptySize() },
      originalDropped: true,
    },
  };
}

/**
 * Пустое место ступени.
 *
 * @remarks
 * Ступень не удаляется из записи, а обнуляется: набор ступеней задан схемой,
 * и запись без поля разошлась бы с ней. Пустое поле читается всеми как
 * «этой копии нет».
 */
function emptySize(): Record<string, null> {
  return { url: null, width: null, height: null, mimeType: null, filesize: null, filename: null };
}
