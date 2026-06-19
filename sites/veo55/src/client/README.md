# veo55-client — Next 15 публичный фронт

Публичная сторона veo55.ru. Знает про cms **только** через `@veo55/contracts` (R3).

## Стек

- **Next 15** + React 19 + App Router (SSR)
- **Tailwind 3.4** — утилиты внутри компонентов (R1)
- **CSS-токены** (`src/styles/tokens.css`) — единый источник палитры/радиусов/типографики (R2)
- **clsx + tailwind-merge** — `cn` helper для условных классов
- **Playwright** — smoke и E2E

## Запуск (локально, без Docker)

```bash
# Из корня монорепо
pnpm --filter veo55-client dev
# → http://localhost:3000
```

Требует чтобы CMS уже была поднята на `http://localhost:3001` (см. `../cms/README.md`).
Через Infisical:

```bash
infisical run --env=dev -- pnpm --filter veo55-client dev
```

## Структура

```
src/
├── app/                       # App Router (Server Components по умолчанию)
│   ├── layout.tsx             # root layout + metadata из SiteSettings
│   └── page.tsx               # главная (заглушка до Шага 4)
├── lib/
│   ├── api-client.ts          # клиент к CMS через @veo55/contracts
│   └── utils.ts               # cn helper
└── styles/
    ├── tokens.css             # CSS-переменные (R2)
    └── globals.css            # tailwind + базовые стили
```

## Принципы

- **R1** — Tailwind утилиты прячутся внутрь компонентов, не голые `<div className="px-4 py-2 bg-...">` на страницах.
- **R2** — никаких `bg-[#hex]` / inline-color. Только переменные из `tokens.css`.
- **R3** — `import from '../../cms/...'` — **запрет**. Только `@veo55/contracts`.
- **R5+** — будущие блоки JSON-сериализуемые, без `children: ReactNode` в публичном API. См. `.claude/rules/common.md` секция R5+.
- **Server Components по умолчанию.** `'use client'` — только когда есть state/effect/handler.

## TODO к Шагу 4

- Real layout: Header (логотип + nav), Footer (контакты + соцсети), Container.
- Базовые блоки: Hero, RichText, Gallery, CTA, Form, Contacts, FAQ.
- Динамический роут `/[slug]/page.tsx` для CMS-страниц.
- shadcn primitives по мере появления контролов (Button, Input, ...). Через `npx shadcn@latest add <name>`, не init авансом.
