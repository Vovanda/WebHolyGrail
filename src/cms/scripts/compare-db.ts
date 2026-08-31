/**
 * Чего не хватает базе против схемы кода.
 *
 * @remarks
 * Нужно при переводе сайта, который жил своей историей миграций, на общую.
 * Прогон истории целиком там падает на «table already exists», а понять, что
 * именно надо доехать, можно только сравнив саму базу со схемой.
 */
import { getPayload } from 'payload';

import config from '../src/payload.config.js';

const payload = await getPayload({ config, disableOnInit: true });
const adapter = payload.db as unknown as {
  schema: unknown;
  requireDrizzleKit: () => { generateDrizzleJson: (schema: unknown) => Promise<unknown> };
  drizzle: { run: (q: unknown) => Promise<unknown> };
};

const { generateDrizzleJson } = adapter.requireDrizzleKit();
const snapshot = (await generateDrizzleJson(adapter.schema)) as {
  tables?: Record<string, { columns?: Record<string, unknown> }>;
};

const wanted = new Map<string, Set<string>>();
for (const [name, def] of Object.entries(snapshot.tables ?? {})) {
  const short = name.includes('.') ? name.split('.').pop()! : name;
  wanted.set(short, new Set(Object.keys(def.columns ?? {})));
}

// Подключение берём у самого адаптера: отдельный клиент из этой папки
// не резолвится, а адаптер уже открыт на нужной базе.
const raw = (
  payload.db as unknown as {
    client: { execute: (q: string) => Promise<{ rows: Array<Record<string, unknown>> }> };
  }
).client;

const list = await raw.execute("select name from sqlite_master where type='table'");
const present = new Set(list.rows.map((r) => String(r['name'])));

const missingTables: string[] = [];
const missingColumns: string[] = [];

for (const [table, columns] of wanted) {
  if (!present.has(table)) {
    missingTables.push(table);
    continue;
  }
  const info = await raw.execute(`PRAGMA table_info(\`${table}\`)`);
  const have = new Set(info.rows.map((r) => String(r['name'])));
  for (const column of columns) {
    if (!have.has(column)) missingColumns.push(`${table}.${column}`);
  }
}

console.log(`таблиц в схеме: ${wanted.size}, в базе: ${present.size}`);
console.log(`нет таблиц: ${missingTables.length}`);
for (const t of missingTables.slice(0, 40)) console.log(`  ${t}`);
console.log(`нет колонок: ${missingColumns.length}`);
for (const c of missingColumns.slice(0, 40)) console.log(`  ${c}`);
process.exit(0);
