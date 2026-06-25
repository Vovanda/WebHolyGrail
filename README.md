<!--
  Web Holy Grail — README (English / Русский)
  License: MIT — https://opensource.org/license/mit
-->

# Web Holy Grail

> Opinionated dev environment and growing component library to ship architecturally honest websites for small businesses — fast, on a clean stack, without lock-in.
>
> Opinionated dev-среда и растущая база компонентов: производство архитектурно честных сайтов для микробизнеса — быстро, на чистом стеке, без vendor lock-in.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)
![Stack: Next.js · Payload · TypeScript](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-purple)

---

## English

### What this is

**Web Holy Grail** is a template monorepo and reference implementation for building production-grade websites for small businesses (kennels, clinics, coffee shops, auto-services, studios, …) on a modern, vendor-neutral stack. Reference site lives in [`sites/veo55/`](sites/veo55/) — a German Shepherd kennel currently in production at [veo55.ru](https://veo55.ru/).

The framework is **opinionated**: one stack, one set of rules (R0–R15), one CMS, one deployment story. Add a new site by copying `_template`, renaming, and letting an LLM agent populate niche-specific content. Architecture is honest from day one — Postgres tables, headless Payload CMS, clean separation between content and presentation. No vendor lock-in: pull the CMS out, the data stays.

### Why this exists

Most small businesses get one of two things:

1. A static HTML site they can't edit, and every text change costs another invoice.
2. A WordPress/Joomla install that grows into a tangle of plugins, where data is welded to the CMS and "scaling up" means throwing everything out and rewriting.

Holy Grail bets on a third path: **boring, predictable, structured by default — without sacrificing the growth path**. A landing page today and a CRM with a customer portal in three years sit on the same foundation. The foundation grows, it does not get replaced.

### Stack

| Layer      | Choice                                                                |
| ---------- | --------------------------------------------------------------------- |
| Frontend   | Next.js (App Router, SSR/SSG), React, shadcn/ui, Tailwind, CSS tokens |
| CMS        | [Payload 3.x](https://payloadcms.com/) (MIT, TypeScript, self-host)   |
| Database   | SQLite by default; Postgres when you grow; one adapter swap           |
| Contracts  | `contracts/` — shared types between client and CMS (the seam)         |
| Containers | Docker + docker-compose (blue-green for prod)                         |
| Storage    | S3-compatible (VK Cloud / Selectel / Yandex / MinIO)                  |
| Secrets    | Infisical (planned) / `.env.local` for now                            |
| Tests      | Vitest + Playwright                                                   |

### Quick start (use this template)

```bash
# 1. Click "Use this template" on GitHub (or clone)
gh repo create my-site --template Vovanda/WebHolyGrail --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. Set up env for veo55 reference site (one-time)
cd sites/veo55
./dev-setup.sh             # creates .env.local files

# 4. Run dev stack (CMS :3001, Client :3000)
./dev.sh
```

Open http://localhost:3000 — homepage, and http://localhost:3001/admin — Payload admin.

### Project structure

```
WebHolyGrail/
├── packages/                  # shared core — grows OUT of sites/, not before
│   ├── ui/  · tokens/  · contracts/    # (currently empty: R9 — abstract after experience)
│   └── _template/             # site scaffold (will be extracted after veo55 stabilises)
├── sites/
│   └── veo55/                 # reference site (German Shepherd kennel)
│       ├── contracts/         # type contracts (above src/)
│       ├── src/
│       │   ├── client/        # Next.js (own Dockerfile)
│       │   └── cms/           # Payload (own Dockerfile)
│       ├── deploy/
│       │   ├── local/         # docker-compose for dev
│       │   └── prod/          # blue-green deploy.sh + compose
│       └── docs/              # site-specific docs
├── deploy/                    # platform-level nginx (when you host many sites)
├── docs/whg/                  # architecture docs (read these!)
└── LICENSE                    # MIT
```

### Documentation

Architecture and design rationale lives in [`docs/whg/`](docs/whg/):

- [`00-vision.md`](docs/whg/00-vision.md) — market positioning and "why now"
- [`10-mission.md`](docs/whg/10-mission.md) — mission statement
- [`15-requirements.md`](docs/whg/15-requirements.md) — what the product must do
- [`30-philosophy.md`](docs/whg/30-philosophy.md) — architectural philosophy, rules R1–R9
- [`32-monorepo-structure.md`](docs/whg/32-monorepo-structure.md) — monorepo layout
- [`33-site-structure.md`](docs/whg/33-site-structure.md) — per-site layout
- [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) — frontend stack & block model
- [`36-block-coverage.md`](docs/whg/36-block-coverage.md) — what Payload covers vs. what needs work
- [`37-scaffolding.md`](docs/whg/37-scaffolding.md) — how a new site is born
- [`38-invariants.md`](docs/whg/38-invariants.md) — invariant data and blocks
- [`39-component-architecture.md`](docs/whg/39-component-architecture.md) — component organisation & variants
- [`70-backend-data.md`](docs/whg/70-backend-data.md) — backend & data
- [`80-devops.md`](docs/whg/80-devops.md) — DevOps & infrastructure
- [`90-architecture-diagram.md`](docs/whg/90-architecture-diagram.md) — high-level architecture diagram

Wiki for tutorials and recipes will be added at https://github.com/Vovanda/WebHolyGrail/wiki.

### Status

**Pre-1.0.** The reference site (veo55.ru) runs on this stack in production. The `_template/` extraction and the public `@holygrail/*` packages are still in progress. Track current state in [`docs/whg/`](docs/whg/).

### Contributing

Issues and discussions are welcome. Code style follows the conventional-commits spec; pre-commit hooks (commitlint + lint) run automatically after `pnpm install`.

### License

[MIT](LICENSE) © 2026 Vladimir Savkin / Sawking.Tech.

---

## Русский

### Что это

**Web Holy Grail** — монорепо-шаблон и эталонная реализация для производства production-grade сайтов микробизнесу (питомники, клиники, кофейни, автосервисы, мастерские, …) на современном, нейтральном к вендору стеке. Эталонный сайт — [`sites/veo55/`](sites/veo55/), это питомник восточноевропейской овчарки [veo55.ru](https://veo55.ru/), который сейчас в продакшене.

Фреймворк **opinionated**: один стек, один набор правил (R0–R15), одна CMS, одна история деплоя. Новый сайт — копия `_template`, переименование, дальше LLM-агент наполняет нишевым контентом. Архитектура честная с первого дня: чистые таблицы Postgres, headless Payload CMS, разделение контента и презентации. Никакого vendor lock-in: сняли CMS — данные на месте.

### Зачем

Микробизнес обычно получает одно из двух:

1. Статический HTML, который нельзя править, и каждая правка текста — снова счёт.
2. WordPress/Joomla, который к третьему году превращается в комок плагинов, где данные сцеплены с движком, а «вырасти» = переписать всё заново.

Holy Grail ставит на третий путь: **скучно, предсказуемо, структурно по умолчанию — без потери траектории роста**. Лендинг сегодня и CRM с кабинетом покупателей через три года живут на одном фундаменте. Фундамент дорастает, а не заменяется.

### Стек

| Слой       | Выбор                                                                         |
| ---------- | ----------------------------------------------------------------------------- |
| Фронт      | Next.js (App Router, SSR/SSG), React, shadcn/ui, Tailwind, CSS-токены         |
| CMS        | [Payload 3.x](https://payloadcms.com/) (MIT, TypeScript, self-host)           |
| БД         | SQLite по умолчанию; Postgres когда понадобится; смена адаптера — одна строка |
| Контракты  | `contracts/` — общие типы между client и CMS (разъём)                         |
| Контейнеры | Docker + docker-compose (blue-green в проде)                                  |
| Хранилище  | S3-совместимое (VK Cloud / Selectel / Yandex / MinIO)                         |
| Секреты    | Infisical (план) / `.env.local` пока                                          |
| Тесты      | Vitest + Playwright                                                           |

### Быстрый старт

```bash
# 1. Нажать "Use this template" на GitHub (или клонировать)
gh repo create my-site --template Vovanda/WebHolyGrail --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. Bootstrap эталонного veo55 (один раз)
cd sites/veo55
./dev-setup.sh

# 4. Запустить dev-стек (CMS :3001, Client :3000)
./dev.sh
```

http://localhost:3000 — главная, http://localhost:3001/admin — админка Payload.

### Документация

Архитектурный контекст — в [`docs/whg/`](docs/whg/). Тематические заметки 00–90 (по нумерации):
видение, миссия, требования, философия, структура монорепо/сайта, фронт-стек, блочная модель, скаффолдинг, инварианты, архитектура компонентов, бэкенд, DevOps, схема.

Wiki со статьями и рецептами — https://github.com/Vovanda/WebHolyGrail/wiki (будет).

### Статус

**Pre-1.0.** Эталонный сайт veo55.ru работает на этом стеке в проде. Извлечение `_template/` и публичных пакетов `@holygrail/*` — в работе. Текущее состояние — в [`docs/whg/`](docs/whg/).

### Лицензия

[MIT](LICENSE) © 2026 Владимир Савкин / Sawking.Tech.
