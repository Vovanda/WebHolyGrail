/**
 * Падает, если схема Payload в коде разошлась с миграциями.
 *
 * push: false — схема попадает в БД только через миграции. Если коллекцию/поле добавили,
 * а `payload migrate:create` не сделали, деплой поднимет контейнер со старой схемой и
 * упадёт в рантайме (`SQLITE_ERROR: no such column`). Ловим это в CI, а не на проде.
 *
 * Сравниваем drizzle-снапшот текущей схемы с последним .json из migrations/.
 */
import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';
import config from '../src/payload.config.js';

type Table = { columns?: Record<string, unknown> };

const columnsOf = (snapshot: { tables?: Record<string, Table> }) => {
  const out: Record<string, string[]> = {};
  for (const [table, def] of Object.entries(snapshot.tables ?? {})) {
    out[table] = Object.keys(def.columns ?? {}).sort();
  }
  return out;
};

const payload = await getPayload({ config, disableOnInit: true });
const adapter = payload.db as unknown as {
  migrationDir: string;
  schema: unknown;
  requireDrizzleKit: () => { generateDrizzleJson: (schema: unknown) => Promise<unknown> };
};

const { generateDrizzleJson } = adapter.requireDrizzleKit();
const fromCode = columnsOf(
  (await generateDrizzleJson(adapter.schema)) as { tables?: Record<string, Table> },
);

const dir = adapter.migrationDir;
const latest = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .pop();

if (!latest) {
  console.error('✗ В migrations/ нет ни одного снапшота — миграции не заведены.');
  process.exit(1);
}

const fromMigrations = columnsOf(
  JSON.parse(fs.readFileSync(path.join(dir, latest), 'utf8')) as { tables?: Record<string, Table> },
);

const problems: string[] = [];
const allTables = [...new Set([...Object.keys(fromCode), ...Object.keys(fromMigrations)])].sort();

for (const table of allTables) {
  const code = fromCode[table];
  const migrated = fromMigrations[table];

  if (code && !migrated) {
    problems.push(`таблица '${table}' есть в коде, но её нет в миграциях`);
    continue;
  }
  if (!code && migrated) {
    problems.push(`таблица '${table}' есть в миграциях, но её нет в коде`);
    continue;
  }

  const added = code!.filter((c) => !migrated!.includes(c));
  const removed = migrated!.filter((c) => !code!.includes(c));
  if (added.length)
    problems.push(`'${table}': колонки есть в коде, но не в миграциях — ${added.join(', ')}`);
  if (removed.length)
    problems.push(`'${table}': колонки есть в миграциях, но не в коде — ${removed.join(', ')}`);
}

if (problems.length) {
  console.error(`✗ Схема разошлась с миграциями (последний снапшот: ${latest}):\n`);
  problems.forEach((p) => console.error(`  - ${p}`));
  console.error('\nСделай миграцию: cd src/cms && pnpm migrate:create <описательное_имя>');
  process.exit(1);
}

console.log(`✓ Схема совпадает с миграциями (снапшот ${latest}, таблиц: ${allTables.length}).`);
process.exit(0);
