---
name: whg-payload-migration
description: Меняешь Payload-блок/коллекцию/глобал — этот скилл даёт точный workflow для миграции SQLite без потери данных
---

# Skill: payload-migration

> Применяй каждый раз когда меняешь схему Payload (поле / коллекция / блок / глобал). Не угадывай — следуй рецепту.

> **Молча и сразу, не спрашивай разрешения.** Если поменял схему — миграция обязательна в той же серии правок. instance admin: «Блять ты заебал меня спрашивать про миграции». «План: создаю миграцию, применить?» = пустой шум, ответ всегда «да». Спрашивай только когда реальная опасность (drop column с нужными данными / подозрительный SQL от drizzle / нет места для backup'а).

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
   cp src/cms/data/<slug>.db src/cms/data/<slug>.db.pre-migrations
   ```

2. **Patch `payload.config.ts`** в `db: sqliteAdapter({...})`:

   ```ts
   db: sqliteAdapter({
     client: { url: process.env.DATABASE_URI ?? 'file:./data/<slug>.db' },
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
   cd src/cms
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
   sqlite3 data/<slug>.db "INSERT INTO payload_migrations (name, batch, created_at, updated_at) VALUES ('<ts>_baseline', 1, datetime('now'), datetime('now')); DELETE FROM payload_migrations WHERE batch = -1;"
   ```

## Стандартный workflow для одной правки

1. Поменял `*.ts` блока/коллекции
2. Создать миграцию:
   ```bash
   cd src/cms
   DOTENV_CONFIG_PATH=.env.local pnpm migrate:create <smth-descriptive>
   ```
3. Открыть сгенерированный `migrations/<ts>_<name>.ts`. drizzle-kit диффит против последнего `.json` снапшота, кладёт SQL в `up`/`down` автоматически.
4. **Проверить `up`** — что именно сгенерилось:
   - **Добавление поля** → один `ALTER TABLE … ADD COLUMN`. Применить как есть.
   - **Удаление поля** → `DROP COLUMN`. Если данные важны — сначала экспорт.
   - **Переименование** → drizzle видит как DROP+ADD (потеря данных!). Заменить на `ALTER TABLE … RENAME COLUMN <old> TO <new>`.
   - **Смена типа** → DROP+ADD (потеря данных). Переписать на: ADD new col → UPDATE с cast'ом → DROP old → RENAME new.
   - **text → array** → CREATE table + DROP COLUMN. Вставить `INSERT … SELECT` для переноса данных **между** ними.

### ⚠️ Snake-case gotcha: `ID` в имени поля

Payload runtime snake-кейсит поля с `ID` суффиксом **по-особому**: вставляет `_` перед каждой капс-буквой.

| Payload field         | Drizzle column | НЕ путать с                  |
| --------------------- | -------------- | ---------------------------- |
| `taskID`              | `task_i_d`     | ~~`task_id`~~                |
| `userID`              | `user_i_d`     | ~~`user_id`~~                |
| `parentID`            | `parent_i_d`   | ~~`parent_id`~~              |
| `rkfID`               | `rkf_i_d`      | ~~`rkf_id`~~                 |
| `dogId` (lowercase d) | `dog_id`       | OK — нет капсов после первой |

**Где это критично:** если пишешь миграцию **руками** (без `migrate:create`) — легко сделать `task_id` вместо `task_i_d` → schema не совпадёт с runtime → **scheduler / runner / любое чтение упадёт** с `SQLITE_ERROR: no such column: task_i_d` на каждом цикле.

**Verify column names после `migrate:create`** (или после ручной правки):

```bash
# Грепнуть Payload-сгенерированный types.ts на name твоего нового поля
grep -E 'task_i_d|task_id' src/cms/payload-types.ts
# Если в types.ts `task_i_d` — миграция должна тоже иметь `task_i_d`
```

История бага: руками-писаная миграция `20260620_185000_payload_jobs.ts` создала `task_id`, runtime ждал `task_i_d` — 5 дней scheduler падал каждую минуту, sync-vk-posts не работал. Fix через rename migration.

**Правило:** если поле содержит `ID` или другие капсы — **обязательно** `migrate:create` через drizzle (он знает правильный snake-case через introspect Payload schema), не писать руками. 5. **Backup перед apply**:

```bash
cp data/<slug>.db data/<slug>.db.bak-$(date +%Y%m%d_%H%M%S)
```

6. **Применить**:
   ```bash
   DOTENV_CONFIG_PATH=.env.local pnpm migrate
   ```
7. Проверить: `pnpm migrate:status` — все миграции зелёные. Открыть админку (`http://localhost:3001/admin`) — данные на месте.
8. **Commit** оба файла (`.ts` и `.json`).

## Post-flight check (после любого CMS-изменения — миграция / endpoint / importMap / custom component)

**Не отчитываюсь «готово» вслепую.** Сам проверяю что изменения встали:

1. **Лог dev-сервера** — после рестарта (или ждать HMR-компиляции) читаю первые ~30 строк лога CMS-таска. Ищу: `error`, `Cannot find module`, `Module not found`, `SyntaxError`, `TypeError`. Если нашёл — фикшу до того как сказать «готово».
2. **`generate:importmap` молчаливый** — после правки `admin.importMap.baseDir` или добавления нового custom component файла **обязательно** открываю сгенерированный `cms/src/app/(payload)/admin/importMap.js`, грепаю мой компонент и проверяю что относительный путь резолвится (от папки `importMap.js` через `../`-цепочку до файла компонента).
3. **Миграция применена** → `sqlite3 data/<slug>.db ".schema <new_table>"` подтверждает что таблица создалась как ожидал. + `SELECT COUNT(*)` если данные мигрировал.
4. **Endpoint добавил** → `curl -X <METHOD> http://localhost:3001/api/<...>` хотя бы один happy-path вызов. Без curl-проверки можно сказать «endpoint готов» но он отдаст 500.
5. **Custom field component** → открыть страницу редактирования соответствующего документа (`/admin/collections/<collection>/<id>`) → убедиться что компонент рендерится. Если в браузере Build Error — фикшу.

Только после прохода чек-листа отчитываюсь о готовности.

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
sqlite3 data/<slug>.db ".schema _pages_v_blocks_quote"
```

## SQLite-quirks

- `ALTER TABLE … DROP COLUMN` — работает с SQLite 3.45+ (libsql 0.4.7 ОК). Запрещён на UNIQUE/CHECK/FK/PK-колонках → table-recreation workaround.
- `ALTER TABLE … RENAME COLUMN` — с SQLite 3.25+, всегда работает.
- `ALTER COLUMN TYPE` — **не существует**. Только table-recreation.
- `PRAGMA foreign_keys` нельзя менять внутри транзакции миграции.

## Аварии и откат

- **Миграция упала на середине** — транзакция откатывается автоматически, БД в том же состоянии что до миграции. Просто исправляешь SQL и снова `pnpm migrate`.
- **Применилась, но баги** — `pnpm migrate:down` откатит последний batch (через `down` функции).
- **Совсем сломалось** — backup восстанавливаешь: `cp data/<slug>.db.bak-XXX data/<slug>.db`, удаляешь файл миграции, начинаешь заново.

## Что НЕ делать

- ❌ Не запускать `pnpm migrate` без backup
- ❌ Не оставлять `push: true` (или дефолт) — теряются данные при rename/type-change
- ❌ Не править схему через произвольные SQL-скрипты в обход миграций — drizzle-snapshot десинхронизируется
- ❌ Не делать `migrate:fresh` если есть пользовательские правки
- ❌ Не коммитить миграцию без `.json` снапшота — следующая `migrate:create` сломается

## Auto-migrate в prod через deploy.sh

В blue-green deploy миграции **применяются автоматически** (см. `deploy/prod/deploy.sh` шаг 3.5):

1. Build → push → pull → up inactive
2. Healthcheck inactive (контейнер up + отвечает на `/api/access` + `/api/health`)
3. **`docker exec <slug>-cms-<INACTIVE> pnpm migrate`** — payload skip'ает уже применённые
4. nginx switch → старый цвет drains

**Идемпотентность** — `payload migrate` смотрит `payload_migrations` table, не применяет повторно. Запуск на каждом deploy безопасен.

**Failure** — `pnpm migrate` exit non-zero → deploy.sh откатывает: down inactive, active не трогает. Сайт продолжает работать на старой schema.

**Не нужно** на VPS вручную дергать `docker exec ... pnpm migrate`. Достаточно push в main — CI build → deploy.sh применяет.

## Blue-green safety (prod)

> На prod деплой через blue-green (`deploy/prod/compose.bluegreen.yml` + `deploy.sh`). Старый и новый цвет работают **на ОДНОЙ БД** во время switch (1-2 минуты). Миграции должны быть **expand-only** — старый цвет не должен падать на новой схеме.

| Изменение                                    | Безопасно в blue-green? | Стратегия                                                                                                                                                  |
| -------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Добавить **новое** поле / коллекцию / индекс | ✅ ДА                   | Один PR. Старый код игнорирует — норм.                                                                                                                     |
| Сделать существующее nullable                | ✅ ДА                   | Один PR.                                                                                                                                                   |
| Переименовать поле                           | ❌ Прямо нельзя         | **2 PR**: (1) добавить новое поле + копировать данные + оставить старое + writes в оба; (2) после deploy и убедиться что трафик на новом — удалить старое. |
| Удалить поле                                 | ❌ Прямо нельзя         | **2 PR**: (1) перестать использовать в коде, deploy; (2) DROP COLUMN отдельным PR.                                                                         |
| Изменить тип / NOT NULL без default          | ❌ Прямо нельзя         | Доп. поле → миграция данных → swap → drop старое (3-4 PR).                                                                                                 |

### Маркеры в коде миграции

В каждом migration-файле первой строкой комментарий:

```ts
// @safe-bluegreen — миграция expand-only, безопасна в blue-green deploy
```

или

```ts
// @needs-maintenance — миграция не backward-compatible, требует maintenance window
```

### Maintenance window для несовместимых миграций

Если миграция не expand-only (rename, drop, type-change в одном PR) — деплой через **maintenance**:

```bash
# 1. nginx → 503 maintenance.html
docker exec holygrail-nginx sh -c 'echo "return 503;" > /tmp/maintenance.conf && nginx -s reload'

# 2. Применить миграции через одну версию (без blue-green)
docker exec <slug>-cms-blue pnpm --filter <slug>-cms migrate

# 3. После — обратно
# (или просто blue-green после миграции с новой image)
```

Это редкий путь — стараемся **избегать**, дисциплина 2-PR-flow для несовместимых изменений.

### Чек после правки схемы (CMS PR-flow)

- [ ] Миграция написана + помечена `@safe-bluegreen` ИЛИ `@needs-maintenance`
- [ ] Если `@needs-maintenance` — в PR description есть план развёртывания (maintenance window)
- [ ] Старый код (тот что уже на проде, до этого PR) — НЕ упадёт на новой схеме (mental check: какие SELECT'ы он делает, есть ли они в новой схеме)
