/**
 * Заготовка миграции перевода: полный набор операций создания схемы.
 *
 * @remarks
 * Сайт, живший своей историей, не может прогнать общую с начала: часть таблиц
 * у него уже есть, а у части не хватает колонок. Нужны две вещи разом -
 * создание недостающих таблиц и добавление недостающих колонок к существующим.
 *
 * Здесь снимается и то, и другое: операции `CREATE` от drizzle и разбор колонок
 * по снимку схемы. Саму миграцию собирает `.tmp/make-align.py`.
 */
import fs from 'fs';
import { getPayload } from 'payload';

import config from '../src/payload.config.js';

const payload = await getPayload({ config, disableOnInit: true });
const adapter = payload.db as unknown as {
  schema: unknown;
  requireDrizzleKit: () => Record<string, unknown>;
};

const kit = adapter.requireDrizzleKit();
const generateJson = kit['generateDrizzleJson'] as (s: unknown) => Promise<unknown>;
const generateMigration = kit['generateMigration'] as (p: unknown, c: unknown) => Promise<string[]>;

interface ColumnDef {
  name?: string;
  type?: string;
  notNull?: boolean;
  default?: unknown;
  primaryKey?: boolean;
}

const current = (await generateJson(adapter.schema)) as {
  tables?: Record<string, { columns?: Record<string, ColumnDef> }>;
};
const empty = await generateJson({});

const statements = await generateMigration(empty, current);
fs.writeFileSync(process.argv[2] ?? 'align.sql', statements.join('\n'));

/*
  Колонки для догона существующих таблиц. Первичный ключ пропускаем: его
  не добавляют к готовой таблице. Обязательную колонку без умолчания тоже -
  SQLite такую добавить не даст, а старые строки заполнить нечем.
*/
const columns: Array<{ table: string; column: string; definition: string }> = [];
for (const [rawTable, def] of Object.entries(current.tables ?? {})) {
  const table = rawTable.includes('.') ? rawTable.split('.').pop()! : rawTable;
  for (const col of Object.values(def.columns ?? {})) {
    if (!col.name || !col.type || col.primaryKey) continue;
    const hasDefault = col.default !== undefined && col.default !== null;
    if (col.notNull && !hasDefault) continue;
    const definition = hasDefault ? `${col.type} DEFAULT ${String(col.default)}` : col.type;
    columns.push({ table, column: col.name, definition });
  }
}

fs.writeFileSync(process.argv[3] ?? 'align-columns.json', JSON.stringify(columns, null, 1));
console.log(`операций: ${statements.length}, колонок для догона: ${columns.length}`);
process.exit(0);
