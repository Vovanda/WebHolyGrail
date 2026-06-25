<!--
  Web Holy Grail — README (English / Русский)
  License: MIT
-->

<div align="center">

# 🌐 Web Holy Grail

**Honest architecture for small-business websites.**
_Boring, predictable, growth-ready. No lock-in._

<br/>

<img src="https://img.shields.io/badge/license-MIT-A23B72?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="MIT License" />
<img src="https://img.shields.io/badge/status-pre--1.0-F18F01?style=for-the-badge" alt="Status pre-1.0" />
<img src="https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=for-the-badge&logo=next.js&logoColor=white" alt="Stack" />

<br/>

🌍 [**Live examples →**](https://whg.sawking.tech) &nbsp;·&nbsp; 📚 [**Docs**](docs/whg/) &nbsp;·&nbsp; 📜 [**License**](LICENSE)

</div>

---

## English

### What it is

**Web Holy Grail** is an opinionated monorepo template and reference stack for shipping production-grade small-business websites — landing pages, kennels, clinics, coffee shops, auto-services, studios — on a modern, vendor-neutral foundation.

You get a clean Next.js front + Payload headless CMS + Postgres on day one. A new site is born by copying `_template`, renaming, and letting an LLM agent populate niche-specific content. The framework is opinionated by design: **one stack, one set of rules (R0–R15), one CMS, one deployment story**. Less choice, more shipping.

### The problem we're solving

Small businesses today get one of two deals — and both punish them later:

1. **Static HTML / "build me a one-pager"** — cheap upfront, but the owner can't change a single line without paying for it. Every typo is another invoice.
2. **WordPress / Joomla / SP Page Builder** — flexible on the surface, a tangle of plugins underneath. Content gets serialised into BLOBs alongside layout settings; data and presentation are welded together. When the business actually grows and wants a customer portal, a CRM, a real backend — the only path forward is **throw it all out and rewrite**. Growth gets punished by the foundation.

The business model in both cases is "sell the dead end, then sell the way out". We're not interested in that.

### The third path

**Boring, predictable, structured by default — without sacrificing the growth path.**

The bet is simple: a landing page today and a six-figure CRM in three years should sit on **the same foundation**. The foundation grows; it does not get replaced.

Held up by one idea: **the database is permanent, everything above it is replaceable**.

- Day one, data lives in clean Postgres tables — not BLOBs.
- Payload CMS sits **on top** of those tables as a swap-able convenience layer, so the owner can edit content without help.
- When the business grows: the dev team pulls Payload out, writes a `.NET`/`Node` backend against the same tables, **migrates nothing** — because the data was correct from the start.
- The stack is so common that hiring someone to maintain it takes a day, not a quarter.

### Why now

The cost floor of doing this honestly used to be high. It is not anymore.

- The bricks are free and good: Postgres, Next.js, Payload, Nginx.
- Docker turned reproducible infra from a DevOps salary into a few config files.
- AI coding assistants do the work that paid a senior yesterday.

The price for honest architecture is no longer "more man-hours". It is "the discipline to design it once and ship it everywhere". That's what this repo is.

### Why this stack

| Layer         | Choice                                               | Why                                                                          |
| ------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Frontend      | **Next.js** (App Router, SSR/SSG) + React            | SEO out of the box, server components, the platform LLM assistants know best |
| UI primitives | **shadcn/ui** + Tailwind + CSS tokens                | Code lives in your repo, no black box                                        |
| CMS           | **Payload 3.x** (MIT, TypeScript)                    | Self-host, headless, single source of truth for schema + admin + API         |
| Database      | **SQLite** by default, **Postgres** when you grow    | One adapter swap, no BLOB sludge                                             |
| Contracts     | `contracts/` workspace                               | One-way dependency: client/cms/api → contracts. Never the other way          |
| Containers    | Docker + compose, **blue-green** for prod            | Restart policy keeps you up; secrets via Infisical (planned)                 |
| Storage       | S3-compatible (VK Cloud / Selectel / Yandex / MinIO) | Same API everywhere                                                          |
| Tests         | Vitest + Playwright                                  | Unit + smoke at every PR                                                     |

### Live examples

Browse what's been built on this stack: **[whg.sawking.tech](https://whg.sawking.tech)**.

### Quick start

```bash
# 1. "Use this template" on GitHub, or:
gh repo create my-site --template Vovanda/WebHolyGrail --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. One-time env setup for the reference site
cd sites/<your-site>
./dev-setup.sh

# 4. Run dev stack (CMS :3001, Client :3000)
./dev.sh
```

Then http://localhost:3000 (homepage) and http://localhost:3001/admin (Payload admin).

### Project structure

```
WebHolyGrail/
├── packages/                  # shared core: grows out of sites/ (R9 — abstract after experience)
│   ├── ui/  ·  tokens/  ·  contracts/
│   └── _template/             # site scaffold
├── sites/
│   └── <site>/
│       ├── contracts/         # type contracts (above src/)
│       ├── src/client/        # Next.js front (own Dockerfile)
│       ├── src/cms/           # Payload CMS (own Dockerfile)
│       └── deploy/{local,prod}/   # docker-compose, blue-green deploy.sh
├── deploy/                    # platform-level nginx (for multi-site hosting)
├── docs/whg/                  # architecture docs
└── LICENSE                    # MIT
```

### Documentation

The full architecture rationale lives in [`docs/whg/`](docs/whg/) and is numbered for stable cross-references:

|                                                                         |                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)                             | Entry point — what this is, what it isn't, core ideas (data/UI/logic separation, modularity) |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)                         | Architectural rules R1–R9 — the core of how everything is built                              |
| [`32-structure.md`](docs/whg/32-structure.md)                           | Monorepo and per-site layout, three growth models                                            |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md)                 | Frontend stack & the block model                                                             |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md)                 | What Payload gives you for free vs. what's still work                                        |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)                       | How a new site is born                                                                       |
| [`38-invariants.md`](docs/whg/38-invariants.md)                         | Data and blocks that repeat in every site                                                    |
| [`39-component-architecture.md`](docs/whg/39-component-architecture.md) | Component organisation & variant tagging                                                     |
| [`70-backend-data.md`](docs/whg/70-backend-data.md)                     | Backend & data — why Payload, why Postgres                                                   |
| [`80-devops.md`](docs/whg/80-devops.md)                                 | DevOps & infrastructure                                                                      |
| [`90-architecture-diagram.md`](docs/whg/90-architecture-diagram.md)     | High-level diagram                                                                           |

Tutorials and cookbooks: [Wiki](https://github.com/Vovanda/WebHolyGrail/wiki) _(coming soon)_.

### Contributing

Issues and discussions welcome. Code style follows [Conventional Commits](https://www.conventionalcommits.org/); pre-commit hooks (commitlint + lint) run automatically after `pnpm install`.

### License

[MIT](LICENSE) © 2026 Vladimir Savkin / [Sawking.Tech](https://sawking.tech).

---

## Русский

### Что это

**Web Holy Grail** — opinionated монорепо-шаблон и эталонный стек для производства production-grade сайтов микробизнесу: лендингов, питомников, клиник, кофеен, автосервисов, мастерских — на современном, нейтральном к вендору фундаменте.

С первого дня — чистый Next.js фронт + headless Payload CMS + Postgres. Новый сайт рождается копированием `_template`, переименованием, дальше LLM-агент наполняет нишевым контентом. Фреймворк намеренно жёсткий: **один стек, один набор правил (R0–R15), одна CMS, одна история деплоя**. Меньше выбора — больше отгрузок.

### Какую проблему решаем

У микробизнеса сегодня обычно два варианта — и оба наказывают позже:

1. **Статический HTML / «сверстай мне одностраничник»** — дёшево на входе, но владелец не может поправить ни строчку без оплаты. Каждая опечатка — новый счёт.
2. **WordPress / Joomla / SP Page Builder** — снаружи гибко, внутри болото плагинов. Контент сериализован в BLOB-ы вместе с настройками вёрстки; данные и презентация сцеплены намертво. Когда бизнес реально вырастает и хочет кабинет покупателя, CRM, нормальный бэкенд — единственный путь: **выбросить и переписать**. Рост наказывается фундаментом.

Бизнес-модель в обоих случаях — «продай тупик, потом продай выход из тупика». Нас это не интересует.

### Третий путь

**Скучно, предсказуемо, структурно по умолчанию — без потери траектории роста.**

Ставка простая: лендинг сегодня и CRM на полмиллиона через три года должны стоять на **одном фундаменте**. Фундамент дорастает, а не заменяется.

Держится это на одной идее: **база данных — неснимаема, всё над ней — заменяемо**.

- День первый: данные в чистом Postgres, не в BLOB-ах.
- Payload-CMS — снимаемый слой удобства над теми же таблицами, чтобы владелец сам правил контент.
- Бизнес вырос: команда снимает Payload, пишет `.NET`/`Node`-бэкенд против тех же таблиц, **ничего не мигрируя** — данные были в порядке с самого начала.
- Стек настолько обычный, что нанять специалиста под него — день, не квартал.

### Почему сейчас

Раньше делать честно стоило дорого. Сейчас — нет.

- Кирпичи лежат бесплатно: Postgres, Next.js, Payload, Nginx.
- Docker превратил воспроизводимую инфраструктуру из зарплаты DevOps в пару конфигов.
- AI-ассистенты делают то, за что вчера платили сеньору.

Цена честной архитектуры больше не «больше человеко-часов». Цена — «дисциплина спроектировать один раз и развернуть везде». Это репо — она.

### Стек и почему

| Слой         | Выбор                                                 | Почему                                                                       |
| ------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| Фронт        | **Next.js** (App Router, SSR/SSG) + React             | SEO из коробки, server components, родная платформа для LLM-ассистентов      |
| UI-примитивы | **shadcn/ui** + Tailwind + CSS-токены                 | Код в твоём репо, не чёрный ящик                                             |
| CMS          | **Payload 3.x** (MIT, TypeScript)                     | Self-host, headless, один источник правды для схемы + админки + API          |
| БД           | **SQLite** по умолчанию, **Postgres** на росте        | Смена адаптера — одна строка                                                 |
| Контракты    | `contracts/` workspace                                | Однонаправленная зависимость: client/cms/api → contracts. Никогда не обратно |
| Контейнеры   | Docker + compose, **blue-green** в проде              | Restart-policy держит онлайн; секреты через Infisical (план)                 |
| Хранилище    | S3-совместимое (VK Cloud / Selectel / Yandex / MinIO) | Один API везде                                                               |
| Тесты        | Vitest + Playwright                                   | Unit + smoke в каждом PR                                                     |

### Живые примеры

Что собрано на этом стеке: **[whg.sawking.tech](https://whg.sawking.tech)**.

### Быстрый старт

```bash
# 1. Нажать "Use this template" на GitHub, или:
gh repo create my-site --template Vovanda/WebHolyGrail --private

# 2. Bootstrap
cd my-site
corepack enable
pnpm install

# 3. Bootstrap эталонного стека (один раз)
cd sites/<your-site>
./dev-setup.sh

# 4. Запустить dev-стек (CMS :3001, Client :3000)
./dev.sh
```

Дальше http://localhost:3000 (главная) и http://localhost:3001/admin (админка Payload).

### Документация

Архитектурный контекст — в [`docs/whg/`](docs/whg/), номера для стабильных ссылок:

|                                                                         |                                                           |
| ----------------------------------------------------------------------- | --------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)                             | Entry point — что это, чем это НЕ является, ключевые идеи |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)                         | Правила R1–R9 — ядро архитектуры                          |
| [`32-structure.md`](docs/whg/32-structure.md)                           | Структура монорепо и сайта, три модели роста              |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md)                 | Фронт-стек и блочная модель                               |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md)                 | Что Payload даёт из коробки vs. что дорабатывается        |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)                       | Как рождается новый сайт                                  |
| [`38-invariants.md`](docs/whg/38-invariants.md)                         | Инварианты данных и блоков                                |
| [`39-component-architecture.md`](docs/whg/39-component-architecture.md) | Архитектура компонентов и вариаций                        |
| [`70-backend-data.md`](docs/whg/70-backend-data.md)                     | Бэкенд и данные                                           |
| [`80-devops.md`](docs/whg/80-devops.md)                                 | DevOps и инфраструктура                                   |
| [`90-architecture-diagram.md`](docs/whg/90-architecture-diagram.md)     | Архитектурная схема                                       |

Туториалы и cookbook'и — [Wiki](https://github.com/Vovanda/WebHolyGrail/wiki) _(скоро)_.

### Статус

**Pre-1.0.** В продакшене уже работает один сайт на этом стеке. Извлечение `_template/` и публичных пакетов `@holygrail/*` — в работе. Текущее состояние — в [`docs/whg/`](docs/whg/).

### Лицензия

[MIT](LICENSE) © 2026 Владимир Савкин / [Sawking.Tech](https://sawking.tech).
