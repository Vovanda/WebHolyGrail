#!/usr/bin/env node
/**
 * Переводит существующую SQLite-базу инстанса в зашифрованную.
 *
 * Зашифровать файл на месте нельзя: ключ задаётся при открытии базы, поэтому
 * данные переносятся в новый файл, открытый с ключом. Исходник не трогаем —
 * скрипт кладёт рядом `.plain-backup`, и откат сводится к переименованию.
 *
 * Порядок:
 *   1. Останавливаем приложение — иначе часть записей уедет мимо копии.
 *   2. DATABASE_ENCRYPTION_KEY=<ключ> node scripts/encrypt-db.mjs <путь-к-.db>
 *   3. Убеждаемся, что счётчики строк совпали, и запускаем приложение с ключом.
 *
 * Ключ хранится в Infisical рядом с остальными секретами инстанса. Потерять его
 * значит потерять базу: без ключа файл не открывается — в этом и смысл.
 */
import { createClient } from '@libsql/client';
import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const key = process.env['DATABASE_ENCRYPTION_KEY'];
const target = process.argv[2];

if (!key) {
  console.error('Нужен DATABASE_ENCRYPTION_KEY в окружении.');
  process.exit(1);
}
if (!target) {
  console.error('Укажите путь к файлу базы: node scripts/encrypt-db.mjs data/site.db');
  process.exit(1);
}

const plainPath = resolve(target);
if (!existsSync(plainPath)) {
  console.error(`Файл не найден: ${plainPath}`);
  process.exit(1);
}

const encryptedPath = `${plainPath}.encrypted`;
const backupPath = `${plainPath}.plain-backup`;

if (existsSync(encryptedPath)) {
  console.error(`Уже существует: ${encryptedPath}. Уберите его и повторите.`);
  process.exit(1);
}

const plain = createClient({ url: `file:${plainPath}` });
const encrypted = createClient({ url: `file:${encryptedPath}`, encryptionKey: key });

/** Объекты схемы в порядке создания: таблицы, затем всё, что на них ссылается. */
async function schemaObjects() {
  const { rows } = await plain.execute(
    `SELECT type, name, sql FROM sqlite_master
     WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
     ORDER BY CASE type WHEN 'table' THEN 0 WHEN 'index' THEN 1 ELSE 2 END`,
  );
  return rows;
}

async function copyRows(table) {
  const { rows, columns } = await plain.execute(`SELECT * FROM "${table}"`);
  if (rows.length === 0) return 0;

  const columnList = columns.map((c) => `"${c}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  const statements = rows.map((row) => ({
    sql: `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders})`,
    args: columns.map((c) => row[c] ?? null),
  }));

  // Пачками: одна транзакция на всю таблицу упирается в память на больших
  // выборках, а построчная запись на тысячах строк заметно медленнее.
  const CHUNK = 500;
  for (let i = 0; i < statements.length; i += CHUNK) {
    await encrypted.batch(statements.slice(i, i + CHUNK), 'write');
  }
  return rows.length;
}

try {
  console.log(`Исходная база:    ${plainPath}`);
  console.log(`Зашифрованная:    ${encryptedPath}`);

  const objects = await schemaObjects();
  const tables = objects.filter((o) => o.type === 'table').map((o) => o.name);

  // Внешние ключи выключены на время переноса: порядок таблиц из sqlite_master
  // не гарантирует, что родитель создаётся раньше ребёнка.
  await encrypted.execute('PRAGMA foreign_keys=OFF');

  for (const object of objects) {
    await encrypted.execute(String(object.sql));
  }
  console.log(`Схема перенесена: ${objects.length} объектов, из них таблиц ${tables.length}`);

  let total = 0;
  for (const table of tables) {
    const copied = await copyRows(String(table));
    total += copied;
    if (copied > 0) console.log(`  ${table}: ${copied}`);
  }
  await encrypted.execute('PRAGMA foreign_keys=ON');

  // Сверяем построчно: молча потерянная таблица — худший исход такой операции.
  let mismatch = false;
  for (const table of tables) {
    const a = await plain.execute(`SELECT COUNT(*) AS n FROM "${table}"`);
    const b = await encrypted.execute(`SELECT COUNT(*) AS n FROM "${table}"`);
    if (a.rows[0]?.['n'] !== b.rows[0]?.['n']) {
      console.error(`Расхождение в ${table}: было ${a.rows[0]?.['n']}, стало ${b.rows[0]?.['n']}`);
      mismatch = true;
    }
  }
  if (mismatch) {
    console.error(
      'Перенос неполный — исходная база не тронута, зашифрованная оставлена для разбора.',
    );
    process.exit(1);
  }

  console.log(`Перенесено строк: ${total}. Расхождений нет.`);

  renameSync(plainPath, backupPath);
  renameSync(encryptedPath, plainPath);
  console.log(`Готово. Незашифрованная копия: ${backupPath}`);
  console.log('Проверьте работу приложения с ключом и удалите её.');
} catch (error) {
  console.error('Сбой переноса:', error instanceof Error ? error.message : error);
  console.error('Исходная база не изменена.');
  process.exit(1);
}
