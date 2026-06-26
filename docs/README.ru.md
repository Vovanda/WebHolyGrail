# Web Holy Grail

Opinionated монорепо-шаблон для production-сайтов малого бизнеса — Next.js (App Router) + Payload CMS + Postgres/SQLite + Docker.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Stack](https://img.shields.io/badge/stack-Next.js%20·%20Payload%20·%20TypeScript-2E86AB?style=flat-square)](docs/whg/30-philosophy.md)

[Docs](docs/whg/) · [English README](README.md)

## Что это

GitHub template-репо с одним стеком, одним набором архитектурных правил (см. [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md)) и одной историей деплоя. Нажми «Use this template» — в корне получишь рабочий каркас Next 15 + Payload 3 (без папки для распаковки), с Infisical-секретами и blue-green деплоем уже подключёнными.

Закрывает разрыв между статичкой (Tilda/Tap-style — нельзя редактировать контент, нет пути роста) и плагинными CMS (WordPress/Strapi — данные сцеплены с презентацией, тяжело вырасти в нормальный бэкенд).

**Один сайт растёт вместе с бизнесом.** Когда компания добавляет новый sub-продукт, блог, команду, case studies — это добавляется как `blocks/domain/<niche>/` + collections + routes в том же репо. Никаких «нам нужен новый сайт» при каждом pivot'е — side-scaling вшит в архитектуру.

Generic-код живёт upstream в этом шаблоне. Каждый инстанс синхронизируется через [`sync-template.sh`](scripts/sync-template.sh) — подтягивает новые примитивы, фиксы и Payload-апгрейды не трогая твои domain-блоки.

## Кому это

Малому бизнесу который:

- перерос Tilda/Tap (нужна реальная CMS + кастомные блоки + своя БД) но не хочет WordPress (plugin hell, PHP, презентация сцеплена с данными)
- стартует как сайт-визитка, потом добавляет каталог, потом блог, потом личный кабинет — постепенно, не всё сразу
- имеет одного разработчика (или малую команду) который ценит opinionated stack вместо бесконечного выбора

Конкретные примеры ниш, под которые шаблон затачивался: питомник/заводчик, кафе/ресторан, клиника/практика, мастер/студия, малый онлайн-магазин с редакторским контентом.

### Что НЕ подойдёт

| Тебе нужно                                      | Возьми                                                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| E-commerce с checkout/платежами как first-class | [Vercel Commerce](https://vercel.com/templates/next.js/nextjs-commerce)       |
| Приложение без CMS                              | [T3 stack](https://create.t3.gg/)                                             |
| Только сайт документации                        | [Astro Starlight](https://starlight.astro.build/)                             |
| Только админка (CRUD над существующей БД)       | [Refine.dev](https://refine.dev/)                                             |
| Headless CMS как сервис                         | [Strapi](https://strapi.io/), [Sanity](https://www.sanity.io/), Payload Cloud |
| Статический блог                                | [Hugo](https://gohugo.io/), [Eleventy](https://www.11ty.dev/), Astro          |

WHG — для «промежуточного» случая: сайт + CMS + место для роста в приложение — одним стеком, в одном репо.

## Статус

Архитектурный дизайн зрелый. Реализация — **work in progress**, см. [открытые issues](https://github.com/Vovanda/WebHolyGrail/issues) (template hardening, CI, тесты, vision-discussions). Рекомендованное использование сегодня: читать, форкать для референса, давать фидбэк. Первый versioned-релиз (`v0.1.0`) — когда закроются critical/high-блокеры.

## Стек

| Слой         | Выбор                                          | Зачем                                                                      |
| ------------ | ---------------------------------------------- | -------------------------------------------------------------------------- |
| Фронт        | **Next.js** (App Router, SSR/SSG) + React      | SSR, файловая роутинг, удобство для редакторов и LLM                       |
| UI-примитивы | **shadcn/ui** + Tailwind + CSS-токены          | Код компонентов в репо, без чёрного ящика                                  |
| CMS          | **Payload 3.x** (MIT, TypeScript)              | Один источник правды: схема + REST/GraphQL + админка из одного конфига     |
| БД           | **SQLite** по умолчанию, **Postgres** на росте | Адаптер меняется одной строкой; реляционно с первого дня                   |
| Контракты    | `contracts/` workspace                         | Однонаправленная зависимость: `client/`, `cms/`, `api/` → `contracts/`     |
| Контейнеры   | Docker + compose, blue-green в проде           | Свой Dockerfile у каждого приложения; reference deploy-скрипты в комплекте |
| Хранилище    | S3-совместимое (любой провайдер или MinIO)     | Один API у всех                                                            |
| Тесты        | Vitest + Playwright                            | Test setup проложен; покрытие WIP (см. issues #19, #20)                    |

## Быстрый старт

```bash
# 1. Создаём инстанс из шаблона (всегда --private — инстансы не публичные):
gh repo create <owner>/my-site --template Vovanda/WebHolyGrail --private --clone
cd my-site

# 2. Устанавливаем:
corepack enable
pnpm install

# 3. Bootstrap (Infisical project + секреты + dev/staging/prod envs):
pnpm setup-infisical -- --site my-site [--type minimal]

# 4. Запускаем dev-стек:
./dev-setup.sh                                 # один раз — MinIO + Infisical defaults
./dev.sh                                       # CMS :3001 + Client :3000
```

Типы проектов: `minimal` (доступен). Дополнительные стартовые пресеты обсуждаются — см. issue [#27](https://github.com/Vovanda/WebHolyGrail/issues/27). Рост всегда через `blocks/domain/<niche>/` поверх стартовой конфигурации.

Дальше http://localhost:3000 (сайт) и http://localhost:3001/admin (админка Payload).

Полный flow scaffolding (machine identity для прода, деплой, sync) — в [`docs/whg/37-scaffolding.md`](docs/whg/37-scaffolding.md).

## Структура проекта

```
.                              # ← корень = твой сайт (нет папки для распаковки)
├── src/
│   ├── client/                # Next.js 15 (App Router, свой Dockerfile)
│   │   └── src/{ui,blocks,layouts,lib,styles,app}/
│   │       blocks/{primitives,layout,decor,system,domain}/
│   └── cms/                   # Payload 3.x (свой Dockerfile)
├── contracts/                 # типизированный разъём — client/cms → contracts (одностороння)
├── deploy/{local,prod,proxy-stack}/
├── scripts/                   # setup-infisical, sync-template, …
├── docs/whg/                  # архитектурная документация
├── .claude/skills/            # holygrail-* + payload* + infisical + template-sync
├── dev.sh, dev-setup.sh       # Infisical-обёрнутый dev
└── LICENSE                    # MIT
```

Четыре уровня компонентов (L1–L4) — `ui/` атомы, `primitives/` молекулы, `layout/`+`decor/` структурные, `domain/` бизнес-ниши — описаны в [`32-structure.md`](docs/whg/32-structure.md).

## Документация

|                                                         |                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [`00-overview.md`](docs/whg/00-overview.md)             | Entry point: что это, чем НЕ является, ключевые архитектурные разделения           |
| [`15-vision.md`](docs/whg/15-vision.md)                 | Stack rationale: почему именно эти выборы, что отвергнуто и почему                 |
| [`30-philosophy.md`](docs/whg/30-philosophy.md)         | Архитектурные правила (аудит идёт — см. issue #25)                                 |
| [`32-structure.md`](docs/whg/32-structure.md)           | Монорепо и структура сайта, три модели роста                                       |
| [`35-frontend-stack.md`](docs/whg/35-frontend-stack.md) | Фронт-стек и блочная модель                                                        |
| [`36-block-coverage.md`](docs/whg/36-block-coverage.md) | Покрытие блочной модели: Payload из коробки vs. кастомная работа                   |
| [`37-scaffolding.md`](docs/whg/37-scaffolding.md)       | Как рождается новый сайт (gh template → Infisical → dev)                           |
| [`38-invariants.md`](docs/whg/38-invariants.md)         | Инвариантные коллекции и блоки, переиспользуемые между сайтами                     |
| [`40-versions.md`](docs/whg/40-versions.md)             | Версии стека, политика апгрейдов, breaking-change дисциплина                       |
| [`45-data-location.md`](docs/whg/45-data-location.md)   | Где живут значения — Payload / Infisical / код, разделение по «кто меняет»         |
| [`stack/`](docs/stack/)                                 | Reference по компонентам стека — версии, установка, MCP servers, AI skills, ссылки |

## Контрибьют и фидбэк

Backlog и design-обсуждения живут в [GitHub Issues](https://github.com/Vovanda/WebHolyGrail/issues). Шаблоны issues: `bug` / `feat` / `chore`. Discussion-треды помечены `discussion` / `vision` — там прорабатываются stack-выборы, project-types policy, shadcn-vs-sync и т.д.

## Лицензия

[MIT](LICENSE) — см. [`LICENSE`](LICENSE).
