---
name: whg-layouts
description: Композиция сайта через Panel/Slot в SiteLayout. Две независимых оси ширины (layout-panels vs content-blocks), 6 слотов (top/bottom/left/right/center/overlay), drawer-канон навигации. Триггерить когда правишь SiteLayout / PanelConfig / layout-presets, добавляешь Header/Footer/NavDrawer/sidebar, выбираешь где живёт ширина блока. Detail-модалки сущностей (карточка собаки/помёта/мастера в попапе) — отдельный скилл `whg-modals`.
---

# Skill: whg-layouts

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

## Detail-модалки (overlay для одной сущности) → `whg-modals`

Если делаешь модалку-карточку **одной сущности** (собака, помёт, FAQ-ответ, член команды, мастер, товар) — это не drawer'ы выше (это были навигационные панели), а отдельный паттерн. Триггерь **`whg-modals`** — там единый канон: варианты позиционирования (right/left drawer, center dialog, bottom sheet, fullscreen) с критериями выбора, шаги добавления новой модалки, R15 same-origin proxy.

Коротко: в `app/layout.tsx` монтируется `<EntityDetailDrawerRoot>` (один на сущность), любая ссылка получает `data-detail-<kind>="<id>"`, click-перехватчик делает `openDetail('<kind>:<id>')` → hash → fetch через `/internal/<entity>/<id>` (same-origin, см. R15). Крестик закрытия всегда top-right, на мобилке fullscreen.

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
