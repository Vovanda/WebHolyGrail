/**
 * Перевод сайта на общую историю миграций.
 *
 * @remarks
 * Сайт, живший своей историей, не может прогнать общую с начала: часть таблиц
 * он завёл сам, и первая же миграция падает на «уже существует». Поэтому все
 * миграции репозитория, кроме выравнивающей, отмечаются применёнными без
 * выполнения, а схему догоняет она одна - создавая недостающее с проверкой
 * существования и ничего не удаляя.
 *
 * Запускается один раз на сайт. На уже переведённой базе не делает ничего:
 * отмечать нечего, а выравнивание к тому времени применено.
 *
 * Проверять надо на копии боевой базы, а не на самой базе.
 */
import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';

import config from '../src/payload.config.js';

/**
 * Имя выравнивающей миграции - той единственной, что выполняется
 * по-настоящему. Передаётся первым доводом: у каждого сайта она своя.
 */
const ALIGN = process.argv[2];

if (!ALIGN) {
  console.error('Какую миграцию выполнять: pnpm tsx scripts/adopt-history.ts <имя>');
  process.exit(1);
}

const payload = await getPayload({ config, disableOnInit: true });
const client = (
  payload.db as unknown as {
    client: {
      execute: (q: unknown) => Promise<{ rows: Array<Record<string, unknown>> }>;
    };
  }
).client;

const done = await client.execute('select name from payload_migrations');
const applied = new Set(done.rows.map((r) => String(r['name'])));

/*
  Имена берутся из каталога, а не импортом индекса: импорт втягивает все
  миграции в проверку типов, и она начинает спотыкаться о старые файлы.
*/
const dir = path.resolve(import.meta.dirname, '..', 'migrations');
const names = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
  .map((f) => f.replace(/\.ts$/, ''))
  .sort();

const toMark = names.filter((n) => n !== ALIGN && !applied.has(n));

if (toMark.length === 0) {
  console.log('отмечать нечего: история уже общая');
  process.exit(0);
}

const batch = done.rows.length > 0 ? 1000 : 1;
const now = new Date().toISOString();

for (const name of toMark) {
  await client.execute({
    sql: 'insert into payload_migrations (name, batch, updated_at, created_at) values (?, ?, ?, ?)',
    args: [name, batch, now, now],
  });
}

console.log(`отмечено применёнными: ${toMark.length}`);
console.log(`осталось выполнить: ${ALIGN}`);
process.exit(0);
