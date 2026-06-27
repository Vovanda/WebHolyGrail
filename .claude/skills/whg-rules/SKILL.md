---
name: whg-rules
description: 9 архитектурных правил Web Holy Grail из docs/whg/30-philosophy.md. R1 — Tailwind прячется внутри компонентов. R2 — только токены, никаких bg-[#hex]. R3 — фронт ↔ CMS только через contracts/. R4 — масштабирование сбоку (новый модуль, не трогать ядро). R5 — блок = чистая функция от пропсов. R6 — без догм по стилизации. R7 — нулевая нагрузка авансом. R8 — доступ к данным через слой, не напрямую в БД. R9 — обобщение снизу-вверх. Плюс практика проекта: SSR-default ('use client' только для DOM/browser API). Триггерить при любом архитектурном выборе: новый блок, contracts, коллекция, стилизация, client/server-разделение, обобщение.
---

# Skill: whg-rules

> 9 правил Web Holy Grail. Применяй при любом архитектурном выборе.

## Когда триггерить

- Создаёшь новый блок (`client/src/blocks/**`) или page (`client/src/app/**`)
- Меняешь contracts / Payload-коллекцию / global
- Решаешь: что в код, что в CMS, что в `_template`, что в site
- Видишь хардкод текста / списка / ссылки на фронте → R0
- Возникает соблазн доменного имени блока (`DogCard`) → R5++
- Выбираешь между ЧПУ и query → R13
- Думаешь делать `'use client'` → R14
- Подключаешь тему / меняешь tokens → R5+++

## R0. Хардкод на фронте = антипаттерн

Контент сайта живёт в БД (Payload), не в коде.

- Текст / список / баннер / ссылка → поле в Payload + чтение через contracts.
- Нет поля в админке для правки → PR-блокер. Добавь поле + убери хардкод.
- Дефолты в коде допустимы только как graceful fallback на пустое поле.

## R1. Не верстать страницы голыми утилитами

Tailwind-утилиты — внутри компонентов, наружу — типизированный React-интерфейс.

```tsx
// ❌
<div className="px-6 py-4 bg-blue-500 rounded-lg text-white font-bold">Заказать</div>
// ✅
<Button variant="primary" size="lg">Заказать</Button>
```

## R2. Токены конечны

Цвет/отступ/радиус/тень/шрифт — только через CSS-переменные из `styles/tokens.css`.

- ❌ `bg-[#3a7bd5]`, `mt-[13px]`, inline-color
- ✅ `bg-bg`, `mt-md`
- Исключение — рантайм-значения через `style={{ '--var': value }}` (это R6).

## R3. Изоляция фронта/бэка через contracts

`client/` не импортирует из `cms/`. Только через `contracts/`. Зависимость однонаправленная.

- ❌ `import { Page } from '../../cms/collections/Pages'` в client
- ✅ `import { Page } from 'contracts/pages'`
- CMS отдаёт данные **в форме contracts**, не в форме своих внутренних типов.

## R4. Масштабирование сбоку

Новая фича = новый сервис / модуль / коллекция + блок к нему. Ядро не трогается.
Бизнес-логика «расчёт стоимости вязки» → отдельный `api/` рядом с `cms/`, не endpoint в Payload.

## R5. Блок = чистая функция от пропсов

На любой глубине. Блок получает пропсы, рендерит детей.

- Не лезет в родителя
- Не тянет данные сам (это делает страница)
- Не знает где стоит

## R5+. Блок совместим с будущим визуальным конструктором

Каждый блок пиши с прицелом на canvas-редактор уровня 3 (см. memory `HolyGrail/36`).

1. **Пропсы JSON-сериализуемы.** Примитивы / массивы / объекты / id-ссылки. ❌ callbacks в основном API, instance классов, Date в сыром виде, React-ноды.
2. **Один контракт пропсов = одна schema в `contracts/`.** Редактор автоматически рисует поля.
3. **Никаких скрытых зависимостей.** Блок не лезет в `useRouter`, `useSearchParams`, глобальный store, `window`, `document` (вне `useEffect`). Всё через пропсы.
4. **Стили самодостаточны.** Не зависит от CSS родителя.
5. **Имена пропсов в meta — русские.** В коде `titleAr`, в meta `'Заголовок'`.
6. **Экспортируй meta:**
   ```ts
   export const HeroMeta = {
     name: 'Hero',
     displayName: 'Главный экран',
     category: 'content',
     schema: HeroPropsSchema,
     defaultProps: { ... },
   } as const;
   ```
7. **Layout vs content.** Layout-блоки принимают `children: BlockNode[]` (массив описаний). Content — листья, без `children`.

❌ `children: React.ReactNode` в API блока. `cloneElement` / render-props / compound. URL/cookies из самого блока. Глобальный store через свободные ключи.

## R5++. Именование функциональное, не доменное

Тест: «Назвал бы я так же для **автосервиса** / **кофейни** / **клиники**? Если нет — плохо.»

✅ `EntityCard`, `EntityGrid`, `EntityPair`, `DetailDialog`, `Lightbox`, `Carousel`, `Hero`, `CTAStrip`, `Timeline`, `BadgeCount`, `Tag`, `ContactsBlock`, `FormBlock`
❌ `DogCard`, `LitterGrid`, `PuppyCounter`, `DogModal`, `BookingForm`

**Где доменные имена ОК:**

- Payload-коллекции (`Dogs`, `Litters`, `Owners`) — это данные, не визуал.
- Страницы маршрутов `app/(site)/dogs/page.tsx` — URL отражает домен.
- `client/blocks/niche/` — последнее место для блока который реально не обобщается (редкий случай).

**Если соблазн `DogCard`:**

1. Что специфично для домена? Если только данные → `EntityCard` с пропсами `image, title, badges, href`.
2. Визуальный паттерн «А × Б» (например, пара/родители) → `EntityPair`.
3. Кажется нишевым → дожми обобщение ещё на уровень. Иерархия → `GenealogyTree` (семья людей / орг-структура / иерархия товаров). Граф связей → `RelationGraph`. Расписание → `ScheduleGrid`.

PR-блокер: имя `*.tsx` содержит доменное слово без явной аргументации.

`client/blocks/niche/` должна быть почти пустой.

## R5+++. Темизация через токены

Тема = override CSS-переменных через `data-theme="<name>"` на `<html>`.

- ❌ `bg-white`, `bg-black`, `text-gray-900`, `bg-slate-50`
- ❌ `dark:` Tailwind-prefix
- ✅ `bg-bg`, `text-ink`, `bg-surface`, `border-border`, `bg-accent` — имена из `tokens.css`
- ✅ Темы в `tokens.css` как `:root[data-theme='dark'] { ... }`
- Контракт `SiteSettings.theme.mode = 'light' | 'dark' | 'auto'`

При копировании shadcn — переименуй `bg-background text-foreground` / `bg-primary` на наши.

## R6. Без догм

- Inline `style` — для рантайм-динамики (`style={{ '--col': cols }}`)
- Utility-классы прямо в JSX — для скорости (если **не публичный блок** — иначе R1)
- Раздельный CSS — для сложных переносимых контролов
- R1/R2/R5 не отменяются

## R7. Целевая нагрузка на старте — нулевая

Без BFF / Redis / реплик / `api/` / `_template` авансом. Highload — следствие чистой архитектуры, добавляется по факту.

## R8. Доступ к данным инкапсулирован

- `cms/` → Payload Local API / Drizzle. Свои обёртки **не делать**.
- `api/` (когда появится) → репозитории по Clean Architecture.
- Конкретная БД (SQLite/Postgres) — деталь, меняется адаптером в `payload.config.ts`.

## R9. Абстракция следует за опытом — снизу вверх

1. Один работающий инстанс
2. Извлечь `_template` в отдельной ветке
3. После 2-3 сайтов — общее в `packages/ui` и `packages/contracts`
4. Когда сборка стала ритуалом — генераторы (`new-site`, `add-block`)

❌ Строить «сразу как надо», изобретать обобщения раньше второго случая.

## R13. URL — ЧПУ для сущностей, query для view

✅ `/dog/zorka-veo`, `/litter/n-2026`, `/news/sertifikat-rkf`, `/about`
❌ `/dog?id=123`, `/page?slug=about`

**Query уместен для:**

- Состояние списка: `/catalog?name=А&p=2`, `/dogs?color=cheprachny&sex=female`
- Cross-cutting: `?utm_source=vk`, `?preview=true`, `?debug=1`
- Share-links с фильтром

**Принцип:**

- Сущность с карточкой → ЧПУ
- Список с выборкой → ЧПУ для коллекции + query для фильтров
- Не плодить два пути к одной странице

**Next App Router:**

- `app/(site)/dog/[slug]/page.tsx`
- `app/(site)/catalog/page.tsx` + `searchParams`

## R14. SSR по умолчанию, client-side fetching только когда оправдан

Default — Server Component с `async function Page()` + `await getX()`.

`'use client'` нужен **только** для:

- Реальный user input (`<input onChange>`, форма)
- Эффект на DOM (focus-trap, scroll-lock, IntersectionObserver, mount-animation)
- Browser API (`localStorage`, `matchMedia`, `navigator`)
- Сторонняя либа требует client

❌ Не повод для `'use client'`:

- «Хочу хук» — большинство хуков заменяются server-логикой
- «Обработчик клика на Link» — Next `<Link>` работает без client
- `useState` для toggle — HTML `<details>` / CSS-only `:has()`

Граница: если блок может быть server — он **обязан** быть им.

## R15. Client-fetch — только same-origin через `/internal/*` proxy

Client-компонент (`'use client'`) не должен делать `fetch(${NEXT_PUBLIC_CMS_URL}/...)` напрямую. Никогда.

**Почему.** Сайт живёт на https-домене, а CMS на `http://localhost:3001` (dev) или `http://cms:3001` (контейнер). Прямой client-fetch с https-страницы на http://localhost (или другой origin):

- Chrome / Edge включают **Private Network Access** — показывают системный попап «сайт запрашивает доступ к локальной сети и другим приложениям». Это видно пользователю и пугает.
- Cross-origin без CORS → fetch падает с opaque error. Возможна race с blocked preflight.
- На проде nginx маршрутит `/api/*` в Payload — рисуем proxy под другим префиксом, не в `/api/`.

**Как делать.** Server-side прокси через Next App Router route handler:

```
sites/<site>/src/client/src/app/internal/<resource>/[id]/route.ts
```

```ts
import { NextResponse } from 'next/server';
import { getResourceById } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const data = await getResourceById(id).catch(() => null);
  if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(data);
}
```

В client-компоненте — relative URL:

```ts
fetch(`/internal/<resource>/${encodeURIComponent(id)}`, { cache: 'no-store' });
```

**Namespace `/internal/*` — почему отдельно от `/api/*`.** local-nginx (`.tmp/local-nginx.conf`) маршрутит `/api/*` в Payload CMS, `/internal/*` в Next-client. Если положить proxy в `/api/internal/...` — на тоннеле nginx уведёт запрос в Payload, который скажет «Route not found». Используем `/internal/` как чёткий неймспейс «client-side proxy в Next».

**Что server-компоненту делать нормально.** SSR (`async function Page()`) ходит напрямую к `NEXT_PUBLIC_CMS_URL` — server-side fetch не касается браузера, PNA не срабатывает, CORS не нужен. R15 — только про код под `'use client'`.

**Пример.** `EntityDetailDrawer.tsx` + `/internal/<entity>/[slug]/route.ts` — модалка карточки сущности.
