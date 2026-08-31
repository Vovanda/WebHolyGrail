/**
 * Якорь схемы: миграция без изменений и снимок нынешнего состояния рядом с ней.
 *
 * @remarks
 * Расхождение проверяется сравнением схемы кода с последним `.json`
 * в migrations/. У сайта, обновлённого синком, последними оказываются снимки
 * шаблона: они описывают схему шаблона, где нет доменных таблиц сайта, зато
 * есть чужие. Проверка объявляет расхождением саму разницу между шаблоном
 * и сайтом, хотя миграции все на месте.
 *
 * Якорь фиксирует состояние: схему он не трогает, но кладёт рядом снимок,
 * который эту схему описывает. Снимок пишется только вместе с миграцией -
 * отдельный файл «снимок сайта» скрыл бы забытую миграцию, потому что
 * записанный прямо из кода он всегда совпадает с кодом.
 *
 * Запуск - после синка, когда тот привёз новые миграции:
 *
 * ```bash
 * pnpm --filter cms migrate:anchor
 * ```
 */
import fs from 'fs';
import path from 'path';

import { getPayload } from 'payload';

import config from '../src/payload.config.js';

/** Имя миграции: дата и время по образцу тех, что генерирует Payload. */
function anchorName(now: Date): string {
  const two = (n: number) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}` +
    `_${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
  return `${stamp}_anchor`;
}

const BODY = `import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-sqlite';

/**
 * Якорь схемы: состояние зафиксировано, изменений нет.
 *
 * @remarks
 * Схему меняли миграции до этой - свои и приехавшие из шаблона. Здесь только
 * снимок рядом, чтобы проверка расхождения сверялась со схемой этого сайта,
 * а не со схемой шаблона.
 */
export async function up(_args: MigrateUpArgs): Promise<void> {
  // Схема не меняется.
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Откатывать нечего.
}
`;

const payload = await getPayload({ config, disableOnInit: true });
const adapter = payload.db as unknown as {
  migrationDir: string;
  schema: unknown;
  requireDrizzleKit: () => { generateDrizzleJson: (schema: unknown) => Promise<unknown> };
};

const dir = adapter.migrationDir;
const name = anchorName(new Date());
const latest = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .pop();

if (latest && latest.replace(/\.json$/, '') > name) {
  console.error(
    `✗ Последний снимок ${latest} новее якоря ${name}: часы разошлись, и якорь окажется не последним.`,
  );
  process.exit(1);
}

const { generateDrizzleJson } = adapter.requireDrizzleKit();
const snapshot = await generateDrizzleJson(adapter.schema);

fs.writeFileSync(path.join(dir, `${name}.ts`), BODY);
fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(snapshot, null, 2));

console.log(`якорь заведён: ${name}.ts и снимок рядом`);
console.log('дальше: pnpm --filter cms check:schema, затем добавить оба файла в коммит');
process.exit(0);
