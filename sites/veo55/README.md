# sites/veo55 — питомник «Омская Дружина»

Первый сайт-визитка в Web Holy Grail. Реальный клиент (заводчик + покупатели в породе) И проверка архитектуры на вшивость (см. CLAUDE.md в корне).

## Целевая структура (из memo `HolyGrail/33`)

> Папки создаются **по мере появления реального наполнения (R9)**, не авансом. Пустые папки с .gitkeep'ами не плодим — путь читается из этой схемы.

```
sites/veo55/
├── README.md                     ← этот файл
├── .env.example                  ← шаблон-документация переменных (значения — в Infisical)
│
├── contracts/                    ✅ типы-разъём client ↔ cms (R3, обратной зависимости нет)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── pages.ts              — PageDoc / PageSeo
│       ├── media.ts              — MediaDoc / MediaRef
│       ├── blocks.ts             — BlockNode / LayoutBlock / ImageRef / LinkRef
│       ├── globals.ts            — SiteSettings / ContactsInfo / SocialLink
│       ├── forms.ts              — FormSubmission / FormSubmissionInput
│       └── theme.ts              — ThemeConfig
│
├── src/
│   ├── client/                   ✅ Next 15, публичный фронт (SSR)
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── Dockerfile / .dockerignore
│   │   ├── README.md
│   │   ├── data/  media/         (пусто — gitkeep, генерится в Docker volume)
│   │   ├── playwright.config.ts
│   │   ├── playwright/           — smoke-тесты
│   │   └── src/
│   │       ├── app/              — App Router (layout.tsx + страницы)
│   │       ├── lib/              — api-client / utils / theme-bootstrap
│   │       ├── styles/           — tokens.css / globals.css
│   │       ├── blocks/           ⏳ Шаг 4+: универсальные блоки (Hero/DecorativeDivider/...)
│   │       │   ├── layout/       — Grid/Stack/Columns (контейнеры с children: BlockNode[])
│   │       │   ├── content/      — Hero/Quote/Timeline/Checklist (листья)
│   │       │   ├── niche/        — почти пустая (см. R5++/R9). Только что реально не обобщить
│   │       │   └── registry.ts
│   │       ├── components/ui/    ⏳ shadcn-примитивы по мере нужды (Button/Dialog/Input...)
│   │       └── layouts/          ⏳ Шаг 4.2: SiteLayout + presets (panels/slots)
│   │
│   ├── cms/                      ✅ Payload 3.x, отдельное Next-приложение
│   │   ├── package.json
│   │   ├── next.config.ts        — withPayload wrapper
│   │   ├── tsconfig.json
│   │   ├── Dockerfile / .dockerignore
│   │   ├── README.md
│   │   ├── data/  media/         (volume для SQLite и загрузок)
│   │   └── src/
│   │       ├── payload.config.ts — i18n: ru, sqlite adapter, sharp
│   │       ├── payload-types.ts  — auto-generated, gitignored
│   │       ├── collections/      — Users / Media / Pages / FormSubmissions
│   │       ├── globals/          — SiteSettings (+ theme group)
│   │       └── app/(payload)/    — admin + REST/GraphQL routes
│   │
│   └── api/                      ⏳ Модель 2 (см. 33/70). Не нужно пока нет бизнес-логики
│                                    кроме контента. Появится если придёт расчёт стоимости,
│                                    интеграция с 1С, кабинет клиента, биллинг.
│
├── deploy/
│   ├── local/                    ✅ docker-compose.yml + README (client + cms + volumes)
│   ├── prod/                     ⏳ Шаг 7: prod-compose + nginx/Traefik + service-token
│   └── db/                       ❌ Не нужно — SQLite через cms-Dockerfile + volume
│
├── docs/                         ⏳ Шаг 7+: Hugo-сайт по клиенту
│   └── content/docs/             — client-brief.md, decisions.md
│
├── tools/                        ⏳ По нужде — per-site линтер/хуки/скрипты деплоя
│
├── .claude/                      ⏳ Шаг 5+ — per-site context для агента
│   ├── CLAUDE.md                 — что специфично для veo55 (vs общего)
│   ├── rules/                    — ссылки на общие правила
│   └── context/                  — рабочая память сессий по veo55
│
└── .mcp.json                     ⏳ По нужде — per-site MCP-серверы (memory namespace veo55)
```

**Легенда:**

- ✅ — есть сейчас, заполнено
- ⏳ — появится по мере R9 (есть в плане, нет в коде)
- ❌ — не нужно (заменено другим решением)

## Принципы

- **R3** — `client/` не импортирует из `cms/`. Только через `contracts/`.
- **R9** — пустые папки авансом не плодим. Если папка появилась — там есть реальный код.
- **R5++ нейминг блоков** — функциональный, не доменный. `EntityCard`, не `DogCard`. `GenealogyTree`, не `PedigreeTree`. `niche/` должна быть почти пустой.
- **R12 темизация** — никаких хардкод-цветов, только токены из `src/client/src/styles/tokens.css`. Темы переключаются через `data-theme` атрибут.

## Запуск (локально)

```bash
# Из корня монорепо
infisical run --env=dev -- pnpm dev          # client + cms одновременно
# или по отдельности
pnpm --filter veo55-cms dev                   # CMS admin → http://localhost:3001/admin
pnpm --filter veo55-client dev                # Сайт → http://localhost:3000
```

Через Docker:

```bash
pnpm compose:up                               # client + cms через docker-compose
pnpm compose:logs                             # стрим логов
pnpm compose:down                             # остановить
```

## Что читать перед изменениями

- `/CLAUDE.md` в корне — главная инструкция
- `.claude/rules/common.md` — R1–R12 развёрнуто
- Memory MCP `HolyGrail/reference/veo55-visual-pasport` — палитра / шрифты / структура страниц
- Memory MCP `HolyGrail/plan/PLAN` — текущий план реализации
- Memory MCP `HolyGrail/session/active` — что прямо сейчас в работе
