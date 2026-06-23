---
name: holygrail-modals
description: Унифицированный канон detail-модалок Web Holy Grail — overlay-карточка одной сущности (собака, помёт, FAQ-ответ, член команды, товар, мастер, …) открывается по клику на ссылку, закрывается Esc / backdrop / history.back. URL-shareable через hash `#d=<kind>:<id>`, SEO-friendly (без JS — full page). Варианты позиционирования (right/left drawer, center dialog, bottom sheet, fullscreen) — критерии выбора по контексту контента и устройству. Данные грузятся через same-origin `/internal/*` proxy (R15). Триггерить когда делаешь любую модалку-карточку сущности, добавляешь кликабельное название с поп-апом, дебажишь системный попап «доступ к локальной сети» в браузере, сомневаешься где разместить overlay (центр vs drawer vs sheet).
---

# Skill: holygrail-modals

> Когда делаешь модалку для **одной сущности** на любом Holy Grail-сайте — следуй этому канону. Не пиши свой DetailDrawer, переиспользуй примитив. Не изобретай новое позиционирование без причины — выбирай из готовых вариантов ниже.

## Когда триггерить

- Делаешь модалку-карточку любой сущности сайта (собака / помёт / FAQ / член команды / товар / мастер / автомобиль — что угодно)
- Кликабельное название / имя / chip должно открывать поп-ап с деталями
- Системный попап Windows «доступ к локальной сети» при клике (R15 violation)
- Hydration-mismatch при открытии модалки
- Нужно расшарить ссылку на конкретную карточку (URL-shareable)
- Сомневаешься какое позиционирование выбрать: центр vs drawer vs bottom-sheet

## Чем это НЕ является

- **Не nav-drawer** (постоянная панель layout'а — NavDrawer, sidebar). Это `holygrail-layouts → Drawer-канон`.
- **Не popover/tooltip** (одна строка возле триггера). Другой паттерн.
- **Не lightbox медиа** — для галерей фото используем `yet-another-react-lightbox` через `PhotoLightbox` / `LightboxImageGroup`.

Detail-модалка — overlay для **одной целостной сущности** у которой есть своя полная страница для SEO/шаринга.

## Принцип

**Full page для шаринга, overlay для UX.** Каждая сущность имеет canonical URL (`/dog/<slug>`, `/litter/<letter>`, `/master/<id>`). Это full-page Server Component — для SEO, шаринга, поисковиков, без-JS пользователей.

Клик из листа / поста / каталога **в браузере с JS** открывает overlay поверх текущей страницы — без навигации, с возвратом по Esc/backdrop/back. URL обновляется в hash `#d=<kind>:<id>` — модалка реоткрывается при перезагрузке/шаринге линка.

## Где показывать overlay — выбор позиционирования

Зависит от **природы контента** и **устройства**. На мобилке вариантов меньше — почти всегда fullscreen или bottom-sheet.

| Вариант           | Когда выбирать                                                                                                   | ПК                                             | Mobile                |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------- |
| **Right drawer**  | Длинный контент (фото-галерея, регалии, родословная, отзывы). Хочется чтобы фон-список оставался виден сбоку     | sliding справа `w-[480px]…w-[640px]`           | fullscreen            |
| **Left drawer**   | То же что right, но right занят (cart / chat / контекст-help сайта)                                              | sliding слева                                  | fullscreen            |
| **Center dialog** | Короткий контент (форма, подтверждение, маленькая инфо-карточка). Решение требует фокуса                         | dialog по центру `max-w-md`, backdrop затемнён | fullscreen            |
| **Bottom sheet**  | Sticky-выбор опций (фильтры, действия), короткий список с поиском. Дружит с мобильным mental-model «полка снизу» | sheet снизу `h-[80vh]`                         | sheet снизу (natural) |
| **Fullscreen**    | Wizard, медиа-просмотрщик, важный onboarding-шаг, сложная сущность с tab'ами                                     | overlay `inset-0`                              | overlay `inset-0`     |

**Критерий выбора в одной фразе:** хочется чтобы фон-список остался видимым → drawer. Нужно сфокусировать внимание → center / fullscreen. Sticky-выбор → bottom sheet.

**На мобилке `<md`** разница между drawer и center исчезает — overlay занимает почти весь viewport, обе становятся fullscreen. Это нормально, паттерн остаётся тот же (та же логика hash / history / data-attr).

## Размещение кнопки закрытия (крестик)

**Top-right всегда.** На ПК и на мобилке. Не центр, не top-left. Причины:

- Большой палец на мобилке достаёт правый верх легче чем левый (для правшей; левши читают зеркально, но крестик в правом верху — индустриальный дефолт)
- Симметрия с burger menu сайта (которое стоит top-right по умолчанию — см. `holygrail-layouts → Дефолт burger справа`)
- Visual hierarchy: глаз приходит в карточку слева-сверху (логотип/имя), уходит справа-сверху (× закрыть)

Размер кликабельной зоны — **минимум 44×44px** на тач-устройствах (Apple HIG / Android Material). Сама иконка может быть 16-20px, но контейнер 44.

## Архитектура

Один экземпляр на сайт — `<EntityDetailDrawerRoot>` в `app/layout.tsx`. Слушает `hashchange`, тянет данные через `/internal/*`, рендерит overlay.

```
┌── app/layout.tsx ─────────────────────────────────┐
│ <DogDetailDrawerRoot />    ← один на сущность     │
│ <LitterDetailDrawerRoot />                        │
│ <MasterDetailDrawerRoot /> ← для другого сайта    │
└───────────────────────────────────────────────────┘
                    │ слушает hashchange
                    ▼
┌── DetailDrawer (primitives) ──────────────────────┐
│ overlay + slide-animation + Esc + body-lock       │
│ + крестик top-right + close handlers              │
└───────────────────────────────────────────────────┘
                    │ контент
                    ▼
┌── DogDetailBody / LitterDetailBody / … ──────────┐
│ name, photos, key facts, кнопка «Подробнее →»    │
└───────────────────────────────────────────────────┘
                    ▲
                    │ fetch (R15 same-origin)
                    │
┌── app/internal/<entity>/[id]/route.ts ────────────┐
│ server-side → Payload Local API → JSON            │
└───────────────────────────────────────────────────┘
                    ▲
                    │ перехват клика
                    │
┌── любой <a href data-detail-<kind>=<id>> ─────────┐
│ Глобальный click listener в Root делает          │
│ e.preventDefault() + openDetail(`<kind>:<id>`)    │
└───────────────────────────────────────────────────┘
```

## Шаги добавления новой модалки

Пример: модалка «карточка мастера автосервиса» для другого Holy Grail-сайта. Аналогично для собаки/помёта/чего угодно.

### 1. Server-side proxy `/internal/master/[id]/route.ts`

**R15: не client-fetch к CMS напрямую.** Создаю Next route handler того же origin что и страница.

```ts
// sites/<site>/src/client/src/app/internal/master/[id]/route.ts
import { NextResponse } from 'next/server';
import { getMasterById } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'no-id' }, { status: 400 });
  const master = await getMasterById(id).catch(() => null);
  if (!master) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(master);
}
```

**Namespace `/internal/*` обязателен.** local-nginx (`deploy/local/nginx.conf` или `.tmp/local-nginx.conf`) маршрутит `/api/*` в Payload CMS, `/internal/*` — в Next-client. Если положить proxy в `/api/`, на demo-tunnel он отвалится 404 от Payload.

### 2. Root-компонент

```tsx
// sites/<site>/src/client/src/blocks/<site>/masters/MasterDetailDrawer.tsx
'use client';

import { useEffect, useState } from 'react';
import type { MasterDoc } from '@<site>/contracts';
import { DetailDrawer, openDetail } from '@/blocks/primitives/DetailDrawer';

export function MasterDetailDrawerRoot() {
  const [id, setId] = useState<string | null>(null);
  const [master, setMaster] = useState<MasterDoc | null>(null);
  const [loading, setLoading] = useState(false);

  // hash → id
  useEffect(() => {
    function check() {
      const m = window.location.hash.match(/^#d=master(?::|%3A)([^&]+)/i);
      setId(m ? decodeURIComponent(m[1] ?? '') : null);
    }
    check();
    window.addEventListener('hashchange', check);
    window.addEventListener('popstate', check);
    return () => {
      window.removeEventListener('hashchange', check);
      window.removeEventListener('popstate', check);
    };
  }, []);

  // Глобальный click-перехват
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-detail-master]');
      if (!target) return;
      const value = target.dataset.detailMaster;
      if (!value) return;
      e.preventDefault();
      openDetail(`master:${value}`);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Fetch через /internal/* (R15)
  useEffect(() => {
    if (!id) {
      setMaster(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/internal/master/${encodeURIComponent(id)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MasterDoc | null) => {
        if (cancelled) return;
        setMaster(data);
      })
      .catch(() => {
        if (cancelled) return;
        setMaster(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return null;

  return (
    <DetailDrawer slug={`master:${id}`} placement="right">
      <MasterDetailBody id={id} master={master} loading={loading} />
    </DetailDrawer>
  );
}
```

### 3. Body — статичный JSX (нет своих хуков)

```tsx
function MasterDetailBody({ id, master, loading }: {...}) {
  if (loading) return <div className="...">Загружаем…</div>;
  if (!master) return <div className="...">Мастер не найден</div>;
  return (
    <article className="...">
      <h2 className="font-display ...">{master.name}</h2>
      {/* hero-фото, специализация, опыт, отзывы */}
      <a href={`/master/${id}`} className="...">Подробнее →</a>
    </article>
  );
}
```

### 4. Подключить Root в `app/layout.tsx`

```tsx
import { MasterDetailDrawerRoot } from '@/blocks/<site>/masters/MasterDetailDrawer';
// ...
<MasterDetailDrawerRoot />;
```

### 5. Кликабельные триггеры

```tsx
<a href={`/master/${master.id}`} data-detail-master={master.id}>
  {master.name}
</a>
```

`href` — для SEO/без-JS/Ctrl+клик. `data-detail-master` — для JS-перехвата → openDrawer.

### 6. Проверка

- **Без JS** (DevTools → disable JS): клик → full page. ✅
- **С JS**: клик → URL обновился, drawer выехал, данные подгружены. ✅
- **Ctrl+клик**: новая вкладка с full page. ✅
- **Esc / backdrop / стрелка «назад»**: drawer закрылся, hash убран. ✅
- **Перезагрузка с hash**: drawer открыт сразу после hydrate. ✅
- **Через demo-tunnel**: нет системного попапа Windows «доступ к локальной сети» (R15). ✅
- **На мобилке**: модалка fullscreen, крестик top-right там же где burger menu. ✅

## Использовать готовое

- **`DetailDrawer.tsx`** (`primitives/DetailDrawer.tsx`) — generic overlay + slide + hash routing + Esc + body-lock + крестик top-right. Принимает `placement?: 'right' | 'left' | 'center' | 'bottom' | 'fullscreen'` (расширяется по мере нужды, см. R9).
- **`openDetail(slug)`** хелпер — `history.pushState` + dispatch hashchange.
- **`parseHash()`** хелпер — разбор `#d=<kind>:<id>`.

## Анти-паттерны

- ❌ Client fetch напрямую к `${NEXT_PUBLIC_CMS_URL}/...` — Chrome Private Network Access → Windows-попап. **R15 violation, только `/internal/*` proxy**.
- ❌ Proxy в `/api/...` — nginx маршрутит `/api` в Payload. 404 на тоннеле.
- ❌ Свой `useDrawer` хук вместо `DetailDrawer` примитива — нарушение R9 (есть готовое — переиспользуй).
- ❌ Состояние модалки в `useState` без hash — модалка не шарится, не реоткрывается, ломает back.
- ❌ Открывать модалку без `<a href>` (только `onClick` на `<button>`) — без JS / Ctrl+клик ничего не работает, SEO=0.
- ❌ Крестик по центру или слева — нарушает индустриальный дефолт и симметрию с burger menu.
- ❌ Маленький tap-target у крестика (`<44px` на мобилке) — промах пальцем = недовольство.
- ❌ Несколько Root'ов одного типа на странице — один экземпляр в `app/layout.tsx`.
- ❌ Server-component внутри `'use client'` Root'а — невозможно технически.
- ❌ Открывать модалку другой сущности из текущей через JS — лучше закрыть текущую и `openDetail` новую (history-stack корректнее).
- ❌ Выбирать центр для длинного контента (галерея с регалиями) на ПК — пользователь теряет контекст списка. Drawer лучше.
- ❌ Drawer на мобилке с `w-[480px]` — превышает viewport. На `<md` всегда fullscreen.

## Прецеденты (живые в репо)

- `sites/veo55/.../DogDetailDrawer.tsx` + `sites/veo55/.../app/internal/dog/[slug]/route.ts` — карточка собаки (right drawer на ПК, fullscreen на мобилке). Триггер — клик по чипу-кличке в постах /news.
- `DetailDrawer.tsx` (`primitives/`) — generic-каркас, используется всеми drawer'ами.
- `SocialLikePopupRoot.tsx` — родственный паттерн для попапа лайкнувших (другой entity, другой триггер `data-like-popup`).

## Связанные правила

- **R15** в `holygrail-rules` — client-fetch только same-origin через `/internal/*`. Это фундамент работы модалок через demo-tunnel и прод-домены.
- **R14** — `'use client'` оправдан для Root'ов (hashchange listener + click перехватчик).
- **R13** — каждой сущности canonical URL (`/dog/<slug>`, `/master/<id>`). Модалка — overlay поверх, не замена.
- **R5** — Body модалки = чистая функция от данных (никаких `useContext` без явного props).
- **`holygrail-layouts → Drawer-канон`** — про **навигационные** drawer'ы (NavDrawer, sidebar). Не путать с detail-модалками этого скилла.
