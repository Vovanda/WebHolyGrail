---
name: holygrail-layouts
description: Композиция сайта через Panel/Slot в SiteLayout. Две независимых оси ширины (layout-panels vs content-blocks), 6 слотов (top/bottom/left/right/center/overlay), drawer-канон навигации + detail-модалок (hash-routing + /internal/* proxy). Триггерить когда правишь SiteLayout / PanelConfig / layout-presets, добавляешь Header/Footer/NavDrawer/sidebar, делаешь модалку-карточку сущности (собака / помёт / FAQ), выбираешь где живёт ширина блока.
---

# Skill: holygrail-layouts

> Дисциплина подготовки макета сайта. Если правишь SiteLayout / PanelConfig — следуй этому.

## Когда триггерить

- Правишь `client/src/layouts/site-layout/` или `client/src/layouts/presets/`
- Добавляешь / меняешь Header / Footer / NavDrawer / sidebar / drawer
- Выбираешь ширину блока — в panel или внутри блока?
- Создаёшь новый slot-content (что положить в `left`/`right`)
- Думаешь объединить две оси ширины — стоп, прочти Анти-паттерны

## Принцип

Сайт собирается **композицией панелей**, не выбором layout-класса.

`SiteLayoutConfig.panels[]` — массив `PanelConfig`. Каждая панель сидит в одном из 6 слотов: `top | bottom | left | right | center | overlay`.

Один компонент `<SiteLayout>` рендерит **любую** конфигурацию.

## Две независимых оси ширины

### Ось 1 — Layout panels (рамка сайта)

- Источник: `SiteSettings.layout.panels[]`
- Кто живёт: Header, Footer, NavDrawer, page-outlet — обёртки сайта
- Регулируется: `panel.size: 'full' | 'wide' | 'content' | 'narrow'` (только для `center`)
- Реализация: `SiteLayout` → `PanelHost` → `centerWidthClass(panel.size)`

### Ось 2 — Page content blocks (тело страницы)

- Источник: `page.blocks[]` из Payload `Pages`
- Кто живёт: Hero, Quote, Timeline, Prose, BannerSlider, WaveDivider
- Регулируется: **внутри самого блока** (`mx-auto max-w-wide px-6` в JSX блока)
- Почему так: блок знает свой content-type. Prose всегда читабельный 880px, Hero всегда wide 1300px. R5++ не нарушается — блок не лезет к родителю, знает свою семантику.

**Не объединять оси.** Лишний слой ради нулевой выгоды.

## Карта слотов

| Slot      | Куда кладём                        | Как рендерится                                         | Ширина             |
| --------- | ---------------------------------- | ------------------------------------------------------ | ------------------ |
| `top`     | Header (sticky), top-banner        | flex column над center                                 | header сам решает  |
| `bottom`  | Footer, mobile-tabbar              | flex column под center                                 | full               |
| `center`  | PageOutlet, статичные блоки        | основной поток                                         | по `panel.size`    |
| `left`    | NavDrawer, sidebar-categories, TOC | **fixed drawer поверх контента** (translateX, overlay) | не отъедает ширину |
| `right`   | Aside, cart, chat, context-help    | симметрично left                                       | не отъедает ширину |
| `overlay` | Fullscreen-search, modal-host      | **не реализован** — добавить при первом кейсе (R9)     | —                  |

## Почему left/right — drawer'ы overlay, не split-pane

Landing-сайт (R7) — контент стабилен, drawer выезжает overlay'ем. Упрощённый AVOX-паттерн.

Если когда-то понадобится split-pane (admin/dashboard) — это **другой `grid.template`** в `SiteLayoutConfig` (например `'app-shell'`), а не правка `'classic-site'`.

## Drawer-канон

Drawer-блок = `'use client'` со своим стейтом. SiteLayout их просто хостит.

- Sticky burger-кнопка `fixed top-4 left-4` (или right-4) — всегда видна
- Drawer `fixed top-0 bottom-0 left-0` с `translate-x-0 | -translate-x-full`
- Overlay `fixed inset-0 bg-ink/40` при `open=true`, клик-вне закрывает
- Escape закрывает (keydown listener)
- При `open=true` ставим `document.body.style.overflow = 'hidden'`
- Ширина — `panel.data.width` (px) или `panel.size`
- Toggle-стейт **внутри drawer'а**. Header / другие панели его не знают.

## Дефолт burger справа

Правши, большой палец на мобиле — burger и nav-drawer **справа** по умолчанию. Слева — только при явной причине.

## Detail-модалки (drawer для одной сущности)

Это **отдельный паттерн от навигационных drawer'ов выше**. Drawer'ы выше — постоянные панели layout'а (NavDrawer, sidebar). Detail-модалка — overlay для **одной сущности** (карточка собаки, помёта, FAQ-ответа), который открывается по клику на ссылку и закрывается по Esc / backdrop / history.back.

### Канон (`DetailDrawer` + `openDetail`)

Уже есть в `client/src/blocks/primitives/DetailDrawer.tsx`. Не пишем свой — переиспользуем.

**URL-shareable.** Состояние модалки в hash: `#d=<kind>:<id>`. Открытие — `openDetail('dog:mars-ares')` → `history.pushState`. Закрытие — `history.back`. SSR-friendly: hash не доходит до сервера, модалки нет до hydrate.

**Корневой компонент** монтируется один раз в `app/layout.tsx`:

```tsx
import { DogDetailDrawerRoot } from '@/blocks/veo55/dogs/DogDetailDrawer';
// ...
<DogDetailDrawerRoot />;
```

Это `'use client'`. Слушает `hashchange` → определяет slug → fetch'ит данные → рендерит `<DetailDrawer slug="dog:<slug>">`.

**Глобальный click-перехватчик** — атрибут `data-detail-dialog="<id>"` на любом `<a href="/<canonical-url>">`:

```tsx
<a href="/dog/mars-ares" data-detail-dialog="mars-ares">
  🐾 Бетэльгейзе Лаэрс Марс-Арэс
</a>
```

Перехватчик в Root делает `e.preventDefault() + openDetail('dog:mars-ares')`. Без JS (или Ctrl+клик) — нормальная навигация на `/dog/mars-ares` (full page). Это даёт SEO/шарингу полную страницу, а UX даёт модалку.

### Загрузка данных в модалку — обязательно через `/internal/*` proxy (R15)

**КРИТИЧНО.** Client-side fetch в DetailDrawer не может ходить напрямую к CMS (`http://localhost:3001`) — Chrome Private Network Access блокирует и показывает системный попап Windows «доступ к локальной сети». Это R15 в `holygrail-rules`.

Правильный паттерн: **same-origin proxy**. Server-side route handler в Next:

```
sites/<site>/src/client/src/app/internal/<entity>/[id]/route.ts
```

```ts
import { NextResponse } from 'next/server';
import { getEntityById } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const data = await getEntityById(id).catch(() => null);
  if (!data) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(data);
}
```

В DetailDrawer-компоненте:

```ts
fetch(`/internal/<entity>/${encodeURIComponent(id)}`, { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : null))
  .then(setData);
```

**Namespace `/internal/*` обязателен.** local-nginx (`.tmp/local-nginx.conf`) маршрутит `/api/*` в Payload CMS. Если положить proxy в `/api/`, на demo-tunnel он отвалится 404 от Payload. `/internal/` всегда идёт в Next.

### Стиль / визуал

- Overlay `fixed inset-0 bg-ink/40` + drawer `fixed right-0 top-0 bottom-0` (или left-0 на левом краю, согласно UX-выбору)
- Sliding-анимация `translate-x-0 | translate-x-full`
- Escape закрывает (keydown listener)
- Body scroll-lock при open=true (`document.body.style.overflow = 'hidden'`)
- Кнопка «Подробнее →» внутри модалки — full-page ссылка для шаринга

### Прецеденты

- `DogDetailDrawer.tsx` + `/internal/dog/[slug]/route.ts` — карточка собаки на /news клик по чипу-кличке
- `DetailDrawer.tsx` — generic-каркас (overlay + slide + hash routing)
- `SocialLikePopupRoot.tsx` — родственный паттерн для попапа с лайкнувшими (другой entity, другой proxy если потребуется)

## Текущий layout конкретного сайта

Composition preset конкретного сайта живёт в `client/src/layouts/presets/<preset>.ts` + описание в `<site>-context` skill. Не дублируем здесь.

## Рецепт добавления панели

1. **Контракт блока** в `contracts/src/blocks.ts` (если новый) — JSON-сериализуемый интерфейс (R5+).
2. **CMS-блок** в `cms/src/blocks/` (если редактируется в админке) — Payload Block-config. Прописать в `cms/src/blocks/index.ts → PAGE_BLOCKS`.
3. **React-компонент** в `client/src/blocks/content/` или `system/`. Если интерактивный — `'use client'`.
4. **Регистрация рендера** в `client/src/layouts/site-layout/block-registry.tsx` — маппинг `blockType` → React-компонент.
5. **Panel** в layout-preset сайта (`client/src/layouts/presets/<preset>.ts`):
   ```ts
   {
     id: 'my-panel',
     slot: 'right',
     content: { kind: 'block', node: { blockType: 'my-block', id: 'panel-my' } },
     size: 'wide',
     mobile: 'overlay',
     visibility: 'always',
     meta: { title: 'Моя панель', icon: 'menu' },
   }
   ```
6. **Проверка**: `data-panel-id="my-panel"` присутствует в HTML.

## Анти-паттерны

- ❌ Хардкод `max-w-wide` в Header / Footer / NavDrawer — это рамка, ширина через `panel.size`. (Исключение — content-блоки Hero/Quote/etc., см. Ось 2.)
- ❌ Глобальный стейт из компонента панели — `SiteSettings` приходит как проп через `PanelHost`.
- ❌ `slot: 'left'` через split-pane на landing'е — всегда drawer overlay.
- ❌ Одно UI в нескольких слотах (burger в Header **и** в NavDrawer) — один источник правды.
- ❌ Layout-presets «про запас». Один preset = один сайт.
- ❌ Вкладывать панели в панели через JSX. Вложенность = содержимое блока, не layout.
- ❌ `ReactNode` / callbacks в `PanelConfig` (он JSON-сериализуем, R5+).
