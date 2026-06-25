---
name: payload-jobs
description: Создаёшь фоновую задачу (sync контента, импорт, periodic check, генерация отчёта) — этот skill даёт workflow Payload 3.x Jobs Queue 1:1 — без велосипеда, с админкой, расписанием, retries и admin-UI кнопкой «Run».
---

# Skill: payload-jobs

> «Облегчённый hangfire» бесплатно. Не пиши свой scheduler — используй Payload-native Jobs Queue (тесты, retries, UI, logging, scheduling, concurrency control — всё уже в Payload 3.x).

## Когда триггерить

- Появилась задача которую нужно запускать **по расписанию** (cron): синк VK/Telegram/IG, импорт РКФ, periodic check, отправка email-дайджеста, перегенерация OG-картинок, инвалидация кеша.
- Нужна **очередь** для тяжёлой операции, которую не хочется делать в HTTP-запросе (генерация PDF, конвертация видео, bulk-импорт).
- Нужна **админка** с историей запусков (status, retries, output, error) и **ручной кнопкой «Run»** для заводчика / контент-менеджера.
- **Не нужен** Hangfire / BullMQ / node-cron — у Payload всё из коробки.

## Что НЕ делать

- ❌ `node-cron` в `instrumentation.ts` / отдельный process — велосипед, тоже самое в Payload.
- ❌ `CronCreate` в Claude session — умрёт при выходе из сессии.
- ❌ Системный cron на сервере (`*/15 * * * * cd /app && pnpm sync:vk-posts`) — нет UI, нет лога, нет retries. Только как **резервная** мера если Payload runner упал.
- ❌ Хранить расписания в кастомной таблице — payload-jobs делает это сам.

## Архитектура — 2 слоя

### Слой 1: чистая бизнес-функция (`lib/<domain>/<name>.ts`)

Принимает `Payload` instance и параметры, возвращает summary, **не** делает `process.exit`. Идемпотентна, можно вызывать из любого места — CLI-seed, task handler, API endpoint, тесты.

```ts
// cms/src/lib/social/sync-vk-posts.ts
import type { Payload } from 'payload';

export interface SyncVkPostsArgs {
  payload: Payload;
  count?: number;
  logger?: (m: string) => void;
}

export interface SyncVkPostsSummary {
  posts: { created: number; updated: number };
}

export async function syncVkPosts(args: SyncVkPostsArgs): Promise<SyncVkPostsSummary> {
  const { payload, count = 30 } = args;
  const log = args.logger ?? ((m) => console.log(`[sync-vk-posts] ${m}`));
  // … бизнес-логика, payload.find/create/update …
  return { posts: { created: 0, updated: 0 } };
}
```

### Слой 2: Payload task (`jobs/<name>.task.ts`)

Тонкая обёртка `TaskConfig`, дёргает бизнес-функцию.

```ts
// cms/src/jobs/sync-vk-posts.task.ts
import type { TaskConfig } from 'payload';
import { syncVkPosts } from '../lib/social/sync-vk-posts';

export const SyncVkPostsTask: TaskConfig<'sync-vk-posts'> = {
  slug: 'sync-vk-posts',
  retries: 2,
  inputSchema: [{ name: 'count', type: 'number', defaultValue: 30, min: 1, max: 100 }],
  outputSchema: [
    {
      name: 'posts',
      type: 'group',
      fields: [
        { name: 'created', type: 'number' },
        { name: 'updated', type: 'number' },
      ],
    },
  ],
  schedule: [
    { cron: '7,22,37,52 * * * *', queue: 'social-sync' }, // off-minutes (не палить :00/:30)
  ],
  handler: async ({ input, req }) => {
    const summary = await syncVkPosts({
      payload: req.payload,
      count: (input as any)?.count,
      logger: (m) => req.payload.logger.info(`[task:sync-vk-posts] ${m}`),
    });
    return { output: summary };
  },
};
```

## Регистрация в `payload.config.ts`

```ts
import { SyncVkPostsTask } from './jobs/sync-vk-posts.task';
import { FetchPedigreeTask } from './jobs/fetch-pedigree.task';

export default buildConfig({
  // … остальное …
  jobs: {
    tasks: [SyncVkPostsTask, FetchPedigreeTask],
    autoRun: [
      // Runner: каждую минуту проверяет все queue, забирает ready job
      { cron: '* * * * *', allQueues: true },
    ],
    jobsCollectionOverrides: ({ defaultJobsCollection }) => ({
      ...defaultJobsCollection,
      labels: { singular: 'Задача (job)', plural: 'Задачи (jobs)' },
      admin: {
        ...defaultJobsCollection.admin,
        hidden: false, // ⚠️ default = true (скрыта)
        group: 'Лента',
        description: 'Фоновые задачи. Можно запустить вручную через «Run».',
      },
    }),
  },
});
```

## Миграция SQLite (1 раз на проект)

Payload **не создаёт** таблицы автоматически если `db.push: false` (наш дефолт по `holygrail-rules`). Нужна **ручная** миграция:

- `payload_jobs` (id, input, completed_at, total_tried, has_error, error, task_slug, queue, wait_until, processing, meta, updated_at, created_at)
- `payload_jobs_log` (array: executed_at, completed_at, task_slug, **`task_i_d`**, input, output, state, error, parent_task_slug, **`parent_task_i_d`**)
- `payload_job_stats` (single-row global для scheduling stats)
- `payload_locked_documents_rels.payload_jobs_id` (polymorphic FK)

### ⚠️ Snake-case gotcha: `taskID` → `task_i_d`

В Payload `payload_jobs_log` есть field `taskID` (строка с UUID конкретной task). Runtime snake-кейсит **с подчёркиванием перед каждой капс**: `taskID` → `task_i_d` (НЕ `task_id`). То же для `parentTaskID` → `parent_task_i_d`.

**Если миграция руками — обязательно `task_i_d`** иначе scheduler упадёт на КАЖДОМ цикле (раз в минуту по `autoRun`):

```
SQLITE_ERROR: no such column: task_i_d
```

→ tasks не запускаются → sync-VK / fetch-pedigree / любая периодика **молча умирает**.

История бага (наш): руками-писаная миграция `task_id` → 5 дней `sync-vk-posts` не работал, `/news` застрял. Fix — rename column.

**Правило:** для `payload_jobs_log` table — **через `pnpm migrate:create`**, не руками. Drizzle-kit генерит правильно. Или хотя бы свериться с `payload-types.ts`:

```bash
grep -E 'task_i_d|task_id' src/cms/payload-types.ts
```

Шаблон — `src/cms/migrations/20260620_185000_payload_jobs.ts` + fix-rename `20260625_010000_payload_jobs_log_task_id_rename.ts` (final корректная schema). Можно копировать.

### Применить

```bash
pnpm migrate
```

На проде через blue-green `deploy.sh` миграции применяются автоматически (см. `payload-migration` skill раздел «Auto-migrate в prod через deploy.sh»). На dev — руками после `migrate:create`.

## Cron-синтаксис

5-полевой стандарт `минута час день месяц день_недели`. Off-minutes — Anthropic-best-practice (не палить `:00/:30` если можно):

```
* * * * *        — каждую минуту (для autoRun runner)
7,22,37,52 * * * *  — каждые 15 мин на off-minutes (sync)
13 4 * * 0       — воскресенье 04:13 (импорт раз в неделю)
0 */2 * * *      — каждые 2 часа на :00
```

Опциональное 6-е поле — секунды (Payload поддерживает): `'* 0 * * * *'` — каждую минуту в `:00` секунду.

## Что smoke-проверить

После регистрации:

1. **Миграция:** `pnpm migrate` → success
2. **Admin:** `http://127.0.0.1:3001/admin/collections/payload-jobs` — 200, шапка «Задачи (jobs)»
3. **Smoke handler из CLI:** для каждого task оставить thin CLI-обёртку `seed/seed-<name>.ts` которая вызывает ту же чистую функцию (`syncVkPosts({payload, …})`). Помогает прогонять без runner'а во время разработки
4. **Scheduling:** дать 1-2 минуты — runner должен сам добавить queue-job в `payload_jobs` (видно в админке)
5. **«Run now» из админки:** в коллекции `payload-jobs` создать job вручную с нужным `taskSlug` и `queue` → runner подберёт в течение 1 мин

## Гарантии Payload Jobs

- **Retries:** `retries: N` в TaskConfig — runner повторит при exception. Лог в `payload_jobs_log[]`.
- **Idempotency:** **нет** автоматически. Реализуй сам — для `sync-vk-posts` это upsert по `(source, sourceId)`.
- **Concurrency control:** `enableConcurrencyControl: true` в `jobs` config — добавляет `concurrencyKey` поле, можно ставить limits per-queue.
- **Order:** FIFO по умолчанию (по `createdAt`). Переопределяется через `processingOrder`.
- **Logging:** `payload-jobs.log[]` — каждая task запоминает input / output / state / error. Видно в админке UI.

## Возможные подводные

- `db.push: false` + добавил task → нужна **миграция вручную**, иначе runner упадёт с `no such table: payload_jobs`.
- `autoRun: '* * * * *'` + scheduled task `'* * * * *'` → дубли. Используй разные cron'ы (runner — частый, task — реже).
- В serverless (Vercel/Cloudflare Workers) **не использовать `autoRun`** — process не живёт долго. Использовать `pnpm payload jobs:handle-schedules` через системный cron + endpoint API для run.
- **JSON-поля** (input/output) в SQLite хранятся text — стандартный type:'json' в Payload. Не путать с `db.adapter` JSON columns в Postgres.
- **`process.exit` в handler** = убийство runner'a. Не делать. Возвращать через `throw new Error(...)` для fail.

## Чек-лист первого подключения

- [ ] `lib/<domain>/<name>.ts` — чистая функция с `{payload, logger}` параметрами
- [ ] `jobs/<name>.task.ts` — TaskConfig с slug, inputSchema, outputSchema, schedule, handler
- [ ] `payload.config.ts` — импорт task в `jobs.tasks`, конфиг `autoRun` и `jobsCollectionOverrides`
- [ ] Миграция SQLite применена (`payload_jobs`, `_log`, `_stats`, `locked_rels.payload_jobs_id`)
- [ ] Smoke: `/admin/collections/payload-jobs` 200, видно меню «Лента → Задачи»
- [ ] CLI-обёртка `seed/seed-<name>.ts` для прогонки в dev без runner'а
- [ ] **F-этап для прода:** запустить с системным cron `*/15 * * * * pnpm payload jobs:handle-schedules` если хотим без долгоживущего process

## Документация

- Payload Jobs Queue overview: https://payloadcms.com/docs/jobs-queue/overview
- Tasks API: https://payloadcms.com/docs/jobs-queue/tasks
- Workflows (оркестрация): https://payloadcms.com/docs/jobs-queue/workflows
- Runner: https://payloadcms.com/docs/jobs-queue/jobs

Через `WebFetch` — память врёт по конкретным API, версии меняются.
