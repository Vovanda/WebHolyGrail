# Vision — почему именно этот стек

> Stack rationale. Каждый ключевой выбор — что взяли, что отвергли, и какой компромисс приняли. Читать после [`00-overview.md`](00-overview.md) и до [`30-philosophy.md`](30-philosophy.md).

WHG — opinionated. Это значит каждый слой стека выбран с обоснованием, и альтернативы рассмотрены явно. Ниже — позиции по каждому решению.

## Ниша, в которую целимся

Между статичкой (Tilda/Tap-style) и plugin-CMS (WordPress/Strapi):

- **Статичка** даёт скорость старта и красивые шаблоны, но контент захардкожен в дизайне, своей БД нет, расширения через JS-виджеты — потолок очень близкий.
- **Plugin-CMS** даёт админку и расширения, но данные сваляны с презентацией (WP: контент в WYSIWYG-HTML; Strapi: схема ⨯ frontend = две системы которые drift'ят), плагины ломаются между релизами, миграция стека = переписать сайт.
- **WHG** — для малого бизнеса который перерос Tilda но не хочет WP. Сайт начинается с визитки, дорастает до каталога + блога + ЛК — внутри одного репо, одного стека, через side-scaling (R4).

Эта ниша определяет компромиссы: setup сложнее чем Tilda (своя инфра, секреты, deploy), но потолок роста выше и долгосрочное сопровождение дешевле.

## Frontend: Next.js 15 (App Router)

**Альтернативы рассмотрены:** Astro, Remix, SvelteKit, Nuxt.

**Почему Next.js:**

- **App Router + RSC** — server components как дефолт даёт SSR без overhead'а на client-state, точно совпадает с природой контентного сайта (большая часть страниц — read-only render из CMS).
- **Экосистема React** — самая большая среди фронт-фреймворков → больше готовых решений (shadcn/ui, headlessui, radix, форм-либы), больше people-pool, больше LLM-tooling. Для малого бизнеса с одним разработчиком это критично.
- **Vercel-агностичный** — Next.js prod-deploy через Docker compose (наш blue-green) работает без Vercel. Не привязка.
- **App Router зрелый** — после 14.x stable, 15 — production-grade. Каноничное file-based routing + nested layouts → R4 (side-scaling) ложится естественно: новый каталог → новая route group.

**Что отвергли:**

- **Astro** — лучше для docs/blog, но плохо для интерактива (islands модель ломается на сложных формах/ЛК). Узкая ниша против нашей growth-story.
- **Remix** — хороший фреймворк, но экосистема меньше, после Shopify-acquisition vector развития неясен.
- **SvelteKit/Nuxt** — меньше community, меньше LLM-tooling, для one-dev команды это потеря времени.

**Компромисс приняли:** Next.js привязывает к React и его quirks (hydration overhead, build-time complexity, периодические breaking changes между мажорами). Принимаем — winning trade за экосистему и SSR-default.

## CMS: Payload 3.x

**Альтернативы рассмотрены:** Strapi, Directus, Sanity, Contentful, headless WordPress.

**Почему Payload:**

- **Single source of truth** — схема + REST + GraphQL + admin UI генерируются из одного TypeScript config'а. Это устраняет drift между типами фронта и схемой БД, что в Strapi/Directus болезненная точка.
- **MIT, self-hostable** — нет vendor lock-in (vs Sanity / Contentful), нет network-call'ов в чужое облако, данные у нас. Для малого бизнеса с unknown growth path — это страховка.
- **TypeScript first-class** — типы collections доступны во фронте через `@payloadcms/db-sqlite`/`payload/types`, contracts-слой получает их одной строкой.
- **Payload 3.x = Next.js-native** — Payload 3 живёт внутри Next.js app router'а как роуты, не отдельный server. Один Docker-образ для cms, один для client, никакой второй runtime.
- **Block model в коде, контент в БД (R0)** — блоки описываются как Payload block-types, контентщик собирает страницу drag'n'drop'ом из них в админке, без правки кода. Это разрезает «pageant pattern» классических CMS.

**Что отвергли:**

- **Strapi** — JavaScript (не TypeScript-first), плагин-модель похожа на WordPress (хрупкая), v4→v5 миграции были болезненные. Не для long-term проекта.
- **Directus** — отличный admin UI, но привязка к существующей БД сильнее (table-first design); для greenfield template это лишний layer.
- **Sanity / Contentful** — SaaS-only, данные в чужой инфре, contract'ы на свободу. Сразу out.
- **Headless WordPress** — PHP-runtime + JS-runtime + GraphQL bridge = три системы где должна быть одна. Plugin hell не уходит.

**Компромисс приняли:** Payload 3.x новее и community меньше чем Strapi, breaking changes между minor-релизами случаются. Принимаем — winning trade за TS-first и Next-native архитектуру.

## Database: SQLite по умолчанию, Postgres когда вырастем

**Почему SQLite default:**

- **Zero ops** для визитки/малого блога: один файл, нет отдельного процесса, бэкап = `cp`. Малый бизнес платит за хостинг $5-10/мес, добавление managed Postgres удваивает счёт без выгоды.
- **Payload adapter swap** — переход на Postgres = замена `@payloadcms/db-sqlite` → `@payloadcms/db-postgres` + DATABASE_URI в env. Application code не меняется (R8: доступ к данным инкапсулирован).
- **Reading-heavy workload** — для контентного сайта (90% reads) SQLite держит легко тысячи RPS на одном инстансе. Не bottleneck.

**Когда переключаться на Postgres (детали в `60-when-to-postgres.md`, тбд через #28):**

- Concurrent writers > 1 (multi-author админка, фоновые jobs пишут в те же таблицы)
- БД > 1GB или нужна репликация
- Multi-instance app для horizontal scaling

**Компромисс приняли:** SQLite не подходит для всех ниш с старта (e-commerce с high write throughput, multi-region — out), и пользователь должен понимать когда мигрировать. Принимаем — фишка в low-friction старте, не в universal fit.

## Contracts seam vs tRPC / direct imports

**Что выбрали:** workspace `contracts/` с чистыми TypeScript-типами + плоская one-way зависимость `client/`, `cms/`, `api/` → `contracts/`.

**Альтернативы рассмотрены:** tRPC, GraphQL codegen, shared monolithic types.

**Почему contracts seam:**

- **Independence**. Frontend deploy не блокирует CMS deploy, и обратно. tRPC создаёт run-time связку (client должен знать router shape сервера), что усложняет blue-green deploy и отдельные релизы.
- **R3 enforceable**. Прямые импорты client ↔ cms запрещены lint-правилом + структурой workspace. Это видно при code-review и в CI. tRPC такой границы не даёт — type-safety есть, но архитектурного барьера нет.
- **Compile-time, not runtime**. `contracts/` — чисто типы и schemas (zod опционально). Нулевой runtime overhead, нулевая network-coupling.
- **Когда появится отдельный backend** (`src/api/` для бизнес-логики) — он подключится через те же contracts. Никаких изменений на стороне client. tRPC потребовал бы переписать integration.

**Что отвергли:**

- **tRPC** — выигрывает в скорости разработки на ранней стадии (auto-completion в IDE), но проигрывает в архитектурной чистоте на длинной дистанции. Для template с growth path первое не оправдывает второе.
- **GraphQL codegen** — Payload генерирует GraphQL endpoint, но потреблять его через codegen на фронте — добавляет build-step и зависимость которая не нужна (REST хватает, и она проще для LLM-tooling).
- **Shared monolithic types** — без `contracts/` workspace всё съедет в круговые зависимости через спринт.

**Компромисс приняли:** chunk бойлерплейта на старте (объявить тип в `contracts/`, импортировать в client и cms). Принимаем — он окупается с первого breaking change.

## Sync-template vs git fork vs npm-пакет

**Что выбрали:** GitHub Template repo + `scripts/sync-template.sh` (whitelist-based rsync) для подтягивания upstream-изменений в downstream-инстансы.

**Альтернативы рассмотрены:** git fork (cherry-pick / rebase), npm-пакет (`@whg/core` как зависимость).

**Почему sync-template:**

- **Downstream — самостоятельный репо**, не fork. Pull request'ы / issues / релизный цикл — свои. Это критично для малого бизнеса где downstream-репо может быть приватным.
- **Whitelist** даёт точный контроль что синкается (primitives, layout, system, deploy-scripts, generic skills) и что — нет (domain blocks, collections, routes — это пользовательский код). Fork не даёт такой границы.
- **rsync = mechanical**. Не требует понимания git-истории upstream. Конфликты решаются файлами, не commit'ами.
- **Offline-friendly**. Sync = скрипт, работает без интернета (только при clone upstream). npm-пакет требовал бы публикации и registry.

**Что отвергли:**

- **Git fork** — теряется автономия downstream (все feature-branches упираются в merge с upstream'ом), и cherry-pick'ить generic-fix'ы вручную — операционная боль.
- **NPM-пакет (`@whg/core`)** — требует строгого API surface (полу-фреймворка) ДО того как мы знаем какой surface правильный. Это R9: обобщение раньше опыта. Может появиться позже, когда 2-3 downstream-инстанса покажут стабильные switching points.

**Компромисс приняли:** sync-template не versioned (нет semver), пользователь должен сам сверять что подтянул. Принимаем — пока downstream-инстансов мало, ручной control важнее автоматизации. Tag-policy (см. #21) частично закроет этот gap.

## Что explicitly решили НЕ делать

- **Visual page builder.** Композиция — в коде через блоки. Контент-менеджер собирает страницу из готовых блоков в админке, но новые блоки добавляет разработчик.
- **Hosting platform.** Bring-your-own-server. Reference blue-green compose included, но мы не Vercel/Netlify.
- **Plugin marketplace.** Расширение через side-scaling (новый workspace, новый блок), не через third-party plugins.
- **E-commerce-first features.** Корзина / checkout / payments — не в core. Для них есть [Vercel Commerce](https://vercel.com/templates/next.js/nextjs-commerce). WHG-сайт может вырасти в e-commerce через `src/api/` + плагины Payload, но это не первичный use-case.
- **Multi-tenant.** Один инстанс = один сайт. Multi-tenancy — это другая архитектура, заводится новый инстанс на новый бизнес.

## Где читать дальше

- [`30-philosophy.md`](30-philosophy.md) — R-rules, которые делают эти выборы операционными
- [`32-structure.md`](32-structure.md) — как monorepo разложен
- [`45-data-location.md`](45-data-location.md) — что где живёт (БД / Infisical / код)
- Открытые vision-issues: [#27](https://github.com/Vovanda/WebHolyGrail/issues/27) (project types), [#26](https://github.com/Vovanda/WebHolyGrail/issues/26) (shadcn), [#25](https://github.com/Vovanda/WebHolyGrail/issues/25) (R-rules audit), [#28](https://github.com/Vovanda/WebHolyGrail/issues/28) (SQLite/Postgres)
