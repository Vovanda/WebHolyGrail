import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import sharp from 'sharp';

const run = promisify(execFile);

/**
 * Превью первой страницы PDF.
 *
 * @remarks
 * Документы на сайте — карта предприятия, лицензии, допуски — показываются
 * плиткой с картинкой. Раньше картинку готовили руками и заливали рядом с
 * файлом: лишний шаг, о котором забывают, и превью разъезжается с документом
 * после его замены.
 *
 * Рендерит `pdftoppm` из poppler-utils (ставится в образ). Системная утилита
 * вместо npm-пакета: не нужно пересобирать нативный модуль под musl при каждом
 * обновлении Node.
 *
 * Сбой рендера не должен ронять загрузку документа — вызывающий код получает
 * `null` и сохраняет PDF без превью.
 */
export async function renderPdfPreview(pdf: Buffer): Promise<Buffer | null> {
  let dir: string | undefined;
  try {
    dir = await mkdtemp(join(tmpdir(), 'pdf-preview-'));
    const input = join(dir, 'input.pdf');
    const outputPrefix = join(dir, 'page');

    await writeFile(input, pdf);

    // -f 1 -l 1 — только первая страница; -r 150 — плотность, при которой
    // текст на превью читается, но файл остаётся лёгким.
    await run('pdftoppm', ['-png', '-f', '1', '-l', '1', '-r', '150', input, outputPrefix], {
      timeout: 20_000,
    });

    // pdftoppm дописывает к префиксу номер страницы, а его ширина зависит от
    // общего числа страниц: `page-1.png` у короткого документа, `page-01.png` у
    // длинного. Поэтому пробуем варианты, а не собираем имя вслепую.
    for (const suffix of ['-1', '-01', '-001']) {
      try {
        const png = await readFile(`${outputPrefix}${suffix}.png`);
        return await sharp(png)
          .resize({ width: 1200, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer();
      } catch {
        // Пробуем следующий вариант имени.
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    if (dir) await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
