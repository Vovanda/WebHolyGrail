---
name: payload-migration
description: Меняешь Payload-блок/коллекцию/глобал — этот скилл даёт точный workflow для миграции SQLite без потери данных
---

# Skill: payload-migration

> Применяй каждый раз когда меняешь схему Payload (поле / коллекция / блок / глобал). Не угадывай — следуй рецепту.

## Когда триггерить

- Добавил / переименовал / удалил поле в `cms/src/blocks/*.ts`, `cms/src/collections/*.ts`, `cms/src/globals/*.ts`
- Поменял тип поля (text → array, number → text, etc.)
- Хочешь поменять `db.adapter` или адаптер-опции

## НЕ триггерить

- Поменял текст / variant / иконку в seed (data, не схема)
- Поменял компонент в `client/src/blocks/` (не CMS-сторона)
- Добавил/удалил Payload-блок без изменения существующих полей

## Pre-flight (один раз для проекта)

Если `cms/src/payload.config.ts` ещё на push-режиме (`pushDevSchema` срабатывает при старте):

1. **Backup БД**:

   ```bash
   cp sites/veo55/src/cms/data/veo55.db sites/veo55/src/cms/data/veo55.db.pre-migrations
   ```

2. **Patch `payload.config.ts`** в `db: sqliteAdapter({...})`:

   ```ts
   db: sqliteAdapter({
     client: { url: process.env.DATABASE_URI ?? 'file:./data/veo55.db' },
     push: false,
     migrationDir: path.resolve(dirname, 'migrations'),
   }),
   ```

3. **`cms/package.json`** добавить scripts:

   ```json
   "migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate",
   "migrate:create": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:create",
   "migrate:status": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:status",
   "migrate:down": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:down",
   "migrate:refresh": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:refresh",
   "migrate:fresh": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:fresh"
   ```

   И devDep:

   ```json
   "devDependencies": { "drizzle-kit": "^0.31.7", ... }
   ```

4. **Baseline миграция** (один раз — закрепить текущее состояние БД как стартовую точку, чтобы dev-payload-migrations table перестала фейлить):

   ```bash
   cd sites/veo55/src/cms
   DOTENV_CONFIG_PATH=.env.local pnpm migrate:create baseline
   ```

   Открыть сгенерированный `migrations/<ts>_baseline.ts`, **`up` и `down` оставить пустыми**:

   ```ts
   export async function up(_: MigrateUpArgs): Promise<void> {}
   export async function down(_: MigrateDownArgs): Promise<void> {}
   ```

   Снапшот `.json` оставить как есть.

   Вручную добавить baseline в `payload_migrations` и убрать push-маркер:

   ```bash
   sqlite3 data/veo55.db "INSERT INTO payload_migrations (name, batch, created_at, updated_at) VALUES ('<ts>_baseline', 1, datetime('now'), datetime('now')); DELETE FROM payload_migrations WHERE batch = -1;"
   ```

## Стандартный workflow для одной правки

1. Поменял `*.ts` блока/коллекции
2. Создать миграцию:
   ```bash
   cd sites/veo55/src/cms
   DOTENV_CONFIG_PATH=.env.local pnpm migrate:create <smth-descriptive>
   ```
3. Открыть сгенерированный `migrations/<ts>_<name>.ts`. drizzle-kit диффит против последнего `.json` снапшота, кладёт SQL в `up`/`down` автоматически.
4. **Проверить `up`** — что именно сгенерилось:
   - **Добавление поля** → один `ALTER TABLE … ADD COLUMN`. Применить как есть.
   - **Удаление поля** → `DROP COLUMN`. Если данные важны — сначала экспорт.
   - **Переименование** → drizzle видит как DROP+ADD (потеря данных!). Заменить на `ALTER TABLE … RENAME COLUMN <old> TO <new>`.
   - **Смена типа** → DROP+ADD (потеря данных). Переписать на: ADD new col → UPDATE с cast'ом → DROP old → RENAME new.
   - **text → array** → CREATE table + DROP COLUMN. Вставить `INSERT … SELECT` для переноса данных **между** ними.
5. **Backup перед apply**:
   ```bash
   cp data/veo55.db data/veo55.db.bak-$(date +%Y%m%d_%H%M%S)
   ```
6. **Применить**:
   ```bash
   DOTENV_CONFIG_PATH=.env.local pnpm migrate
   ```
7. Проверить: `pnpm migrate:status` — все миграции зелёные. Открыть админку (`http://localhost:3001/admin`) — данные на месте.
8. **Commit** оба файла (`.ts` и `.json`).

## Шаблон миграции файла

```ts
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`
    -- ваш SQL здесь
  `);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`
    -- откат
  `);
}
```

- Метод **`db.run`** (для SQLite). На Postgres был бы `db.execute`.
- Транзакция обёртывает каждый файл автоматически. Не вызывать `BEGIN`/`COMMIT`.
- Можно несколько `db.run(...)` подряд — все в одной транзакции.

## Пример: text → array (наш кейс photoUrl → photoUrls)

```ts
import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // 1. Создаём таблицу под array
  await db.run(sql`
    CREATE TABLE \`pages_blocks_quote_photo_urls\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`url\` text NOT NULL,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`pages_blocks_quote\`(\`id\`) ON DELETE cascade
    );
  `);
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_photo_urls_order_idx\` ON \`pages_blocks_quote_photo_urls\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`pages_blocks_quote_photo_urls_parent_id_idx\` ON \`pages_blocks_quote_photo_urls\` (\`_parent_id\`);`,
  );

  // 2. Переносим существующие photo_url
  await db.run(sql`
    INSERT INTO \`pages_blocks_quote_photo_urls\` (\`_order\`, \`_parent_id\`, \`id\`, \`url\`)
    SELECT 0, id, lower(hex(randomblob(12))), photo_url
    FROM \`pages_blocks_quote\`
    WHERE photo_url IS NOT NULL AND photo_url <> '';
  `);

  // 3. Дропаем старую колонку
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`photo_url\`;`);

  // 4. Повторить для versions table если versions/drafts включены в коллекции
  // (проверить наличие через `.schema _pages_v_blocks_quote`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD COLUMN \`photo_url\` text;`);
  await db.run(sql`
    UPDATE \`pages_blocks_quote\`
    SET \`photo_url\` = (
      SELECT url FROM \`pages_blocks_quote_photo_urls\`
      WHERE _parent_id = \`pages_blocks_quote\`.id
      ORDER BY _order ASC LIMIT 1
    );
  `);
  await db.run(sql`DROP TABLE \`pages_blocks_quote_photo_urls\`;`);
}
```

## Versions / drafts — не забыть v-таблицы

Если в коллекции (`Pages.ts` etc.) включены `versions: true` / `drafts: true`:

- Любая таблица `pages_blocks_<x>` имеет parallel `_pages_v_blocks_<x>` (с extra `_uuid` колонкой)
- Любая array-таблица `pages_blocks_<x>_<arr>` имеет `_pages_v_blocks_<x>_<arr>`
- **Миграция должна повторить операцию для v-таблицы**. drizzle-kit обычно генерит обе — проверить.

Проверка какие v-таблицы есть:

```bash
sqlite3 data/veo55.db ".schema _pages_v_blocks_quote"
```

## SQLite-quirks

- `ALTER TABLE … DROP COLUMN` — работает с SQLite 3.45+ (libsql 0.4.7 ОК). Запрещён на UNIQUE/CHECK/FK/PK-колонках → table-recreation workaround.
- `ALTER TABLE … RENAME COLUMN` — с SQLite 3.25+, всегда работает.
- `ALTER COLUMN TYPE` — **не существует**. Только table-recreation.
- `PRAGMA foreign_keys` нельзя менять внутри транзакции миграции.

## Аварии и откат

- **Миграция упала на середине** — транзакция откатывается автоматически, БД в том же состоянии что до миграции. Просто исправляешь SQL и снова `pnpm migrate`.
- **Применилась, но баги** — `pnpm migrate:down` откатит последний batch (через `down` функции).
- **Совсем сломалось** — backup восстанавливаешь: `cp data/veo55.db.bak-XXX data/veo55.db`, удаляешь файл миграции, начинаешь заново.

## Что НЕ делать

- ❌ Не запускать `pnpm migrate` без backup
- ❌ Не оставлять `push: true` (или дефолт) — теряются данные при rename/type-change
- ❌ Не править схему через произвольные SQL-скрипты в обход миграций — drizzle-snapshot десинхронизируется
- ❌ Не делать `migrate:fresh` если есть пользовательские правки
- ❌ Не коммитить миграцию без `.json` снапшота — следующая `migrate:create` сломается
