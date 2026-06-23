---
name: holygrail-modals
description: Канон detail-модалок Holy Grail-сайтов — карточка сущности (собака / помёт / FAQ / член команды) открывается overlay-drawer'ом по клику на ссылку, закрывается Esc / backdrop / history.back. URL-shareable через hash `#d=<kind>:<id>`, SEO-friendly (без JS — обычная навигация на full page). Данные грузятся через same-origin `/internal/*` proxy (R15), не напрямую к CMS. Триггерить когда делаешь модалку-карточку любой сущности, добавляешь кликабельную кличку/название с поп-апом, дебажишь системный попап «доступ к локальной сети» в браузере.
---

# Skill: holygrail-modals

> Когда делаешь модалку для **одной сущности** — следуй этому канону. Не пиши свой DetailDrawer, переиспользуй.

## Когда триггерить

- Делаешь модалку-карточку собаки / помёта / FAQ-ответа / члена команды / любой сущности
- Кликабельная кличка / название должна открывать поп-ап с деталями
- Володя жалуется на системный попап Windows «доступ к локальной сети» при клике
- Hydration-mismatch при открытии модалки
- Нужно расшарить ссылку на конкретную карточку (модалка должна быть URL-shareable)

## Чем это НЕ является

- **Не nav-drawer** (постоянная панель layout'а — NavDrawer, sidebar). Эти живут в `SiteLayout.panels[]` и описаны в `holygrail-layouts → Drawer-канон` (drawer'ы навигации).
- **Не popover/tooltip** (мелкий oneline-фрагмент возле триггера). Это другой паттерн.
- **Не lightbox для медиа** — для галерей фото есть `yet-another-react-lightbox` через `PhotoLightbox` / `LightboxImageGroup`.

Detail-модалка — overlay для **одной целостной сущности** с собственной полной страницей.

## Принцип

**Full page для шаринга, drawer для UX.** Каждая сущность имеет canonical URL (`/dog/<slug>`, `/litter/<letter>`, `/faq/<slug>`). Это full-page Server Component — для SEO, шаринга, поисковиков, без-JS пользователей.

Клик из листа / VK-поста / каталога **в браузере с JS** открывает overlay-drawer **поверх текущей страницы** — без навигации, с возвратом по Esc/backdrop/back. URL обновляется в hash `#d=<kind>:<id>` — модалка реоткрывается при перезагрузке/шаринге линка.

## Архитектура

Один экземпляр на сайте — `<EntityDetailDrawerRoot>` в `app/layout.tsx`. Слушает `hashchange`, тянет данные через `/internal/*`, рендерит overlay.

```
┌── app/layout.tsx ─────────────────────────────────┐
│ <DogDetailDrawerRoot />   ← один на сайт          │
│ <LitterDetailDrawerRoot /> ← новая сущность       │
└───────────────────────────────────────────────────┘
                    │ слушает hashchange
                    ▼
┌── DetailDrawer (primitives) ──────────────────────┐
│ overlay + slide-animation + Esc + body-lock       │
└───────────────────────────────────────────────────┘
                    │ контент
                    ▼
┌── DogDetailBody / LitterDetailBody ───────────────┐
│ name, photos, key facts, кнопка «Подробнее →»     │
└───────────────────────────────────────────────────┘
                    ▲
                    │ fetch
                    │
┌── app/internal/dog/[slug]/route.ts ───────────────┐
│ server-side → Payload Local API → JSON            │
└───────────────────────────────────────────────────┘
                    ▲
                    │ перехват клика
                    │
┌── любой <a href data-detail-dialog=<id>> ─────────┐
│ Глобальный click listener в Root делает          │
│ e.preventDefault() + openDetail(`<kind>:<id>`)    │
└───────────────────────────────────────────────────┘
```

## Шаги добавления новой модалки

Делаю модалку «карточка помёта» как пример. Аналогично — для FAQ, person, любого entity.

### 1. Server-side proxy `/internal/litter/[letter]/route.ts`

**КРИТИЧНО.** Не client-fetch к CMS напрямую (R15 в `holygrail-rules`). Создаю Next route handler того же origin что и страница.

```ts
// sites/<site>/src/client/src/app/internal/litter/[letter]/route.ts
import { NextResponse } from 'next/server';
import { getLitterByLetter } from '@/lib/api-client';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ letter: string }> },
): Promise<NextResponse> {
  const { letter } = await ctx.params;
  if (!letter) return NextResponse.json({ error: 'no-letter' }, { status: 400 });
  const litter = await getLitterByLetter(letter).catch(() => null);
  if (!litter) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  return NextResponse.json(litter);
}
```

**Namespace `/internal/*` обязателен.** local-nginx (`.tmp/local-nginx.conf`) маршрутит `/api/*` в Payload CMS, `/internal/*` — в Next-client. Если положить proxy в `/api/`, на demo-tunnel он отвалится 404 от Payload.

### 2. Root-компонент `LitterDetailDrawerRoot`

```tsx
// sites/<site>/src/client/src/blocks/<site>/litters/LitterDetailDrawer.tsx
'use client';

import { useEffect, useState } from 'react';
import type { LitterDoc } from '@veo55/contracts';
import { DetailDrawer, openDetail } from '@/blocks/primitives/DetailDrawer';

export function LitterDetailDrawerRoot() {
  const [letter, setLetter] = useState<string | null>(null);
  const [litter, setLitter] = useState<LitterDoc | null>(null);
  const [loading, setLoading] = useState(false);

  // hash → letter
  useEffect(() => {
    function check() {
      const m = window.location.hash.match(/^#d=litter(?::|%3A)([^&]+)/i);
      setLetter(m ? decodeURIComponent(m[1] ?? '') : null);
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
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-detail-litter]');
      if (!target) return;
      const value = target.dataset.detailLitter;
      if (!value) return;
      e.preventDefault();
      openDetail(`litter:${value}`);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Fetch через same-origin proxy (R15)
  useEffect(() => {
    if (!letter) {
      setLitter(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/internal/litter/${encodeURIComponent(letter)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LitterDoc | null) => {
        if (cancelled) return;
        setLitter(data);
      })
      .catch(() => {
        if (cancelled) return;
        setLitter(null);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [letter]);

  if (!letter) return null;

  return (
    <DetailDrawer slug={`litter:${letter}`}>
      <LitterDetailBody letter={letter} litter={litter} loading={loading} />
    </DetailDrawer>
  );
}
```

### 3. Body-контент модалки

Server-component не получится (мы внутри `'use client'` Root'а) — делаем простой статичный JSX, без своих хуков:

```tsx
function LitterDetailBody({ letter, litter, loading }: {...}) {
  if (loading) return <div className="...">Загружаем…</div>;
  if (!litter) return <div className="...">Помёт не найден</div>;
  return (
    <article className="...">
      <h2 className="font-display ...">Помёт {letter}</h2>
      {/* hero-фото, пара родителей, краткий список щенков */}
      <a href={`/litter/${letter}`} className="...">Подробнее →</a>
    </article>
  );
}
```

Кнопка «Подробнее →» ведёт на full-page — это и есть точка шаринга.

### 4. Подключить Root в `app/layout.tsx`

```tsx
import { DogDetailDrawerRoot } from '@/blocks/<site>/dogs/DogDetailDrawer';
import { LitterDetailDrawerRoot } from '@/blocks/<site>/litters/LitterDetailDrawer';

// ...
<DogDetailDrawerRoot />
<LitterDetailDrawerRoot />
```

### 5. Кликабельные триггеры

Любая ссылка на сущность в листах, чипах, постах:

```tsx
<a href={`/litter/${letter}`} data-detail-litter={letter}>
  Помёт «{letter}» — рождён {dob}
</a>
```

`href` — для SEO/без-JS/Ctrl+клик. `data-detail-litter` — для перехвата JS-кликом → openDrawer.

### 6. Проверка

- **Без JS** (DevTools → disable JS): клик → переход на `/litter/<letter>` full page. ✅
- **С JS**: клик → URL обновился в `#d=litter:<letter>`, drawer выехал, данные подгружены. ✅
- **Ctrl+клик**: новая вкладка с full page. ✅
- **Esc / backdrop / стрелка «назад»**: drawer закрылся, hash убран. ✅
- **Перезагрузка с hash**: drawer открыт сразу после hydrate. ✅
- **Через demo-tunnel** `https://<site>.sawking.tech` — без системного попапа «доступ к локальной сети» (R15 = same-origin proxy). ✅

## Использовать готовое

- **`DetailDrawer.tsx`** (`primitives/DetailDrawer.tsx`) — generic overlay + slide + hash routing. **НЕ переписывать.**
- **`openDetail(slug)`** хелпер — `history.pushState` + dispatch hashchange.
- **`parseHash()`** хелпер — разбор `#d=<kind>:<id>`.

## Стиль / визуал

- Overlay `fixed inset-0 bg-ink/40` + drawer `fixed right-0 top-0 bottom-0` (или left, согласно UX-выбору сайта)
- Slide-анимация `translate-x-0 | translate-x-full`, duration ~250ms
- Esc закрывает (keydown listener в DetailDrawer уже есть)
- Body scroll-lock при open=true (`document.body.style.overflow = 'hidden'`)
- Кнопка «Подробнее →» внутри — full-page ссылка для шаринга
- Шапка модалки sticky — чтобы при длинном контенте кнопка закрытия не уезжала

## Анти-паттерны

- ❌ Client fetch напрямую к `${NEXT_PUBLIC_CMS_URL}/...` — Chrome Private Network Access → Windows-попап. R15 violation. **Только `/internal/*` proxy**.
- ❌ Proxy в `/api/...` — nginx маршрутит `/api` в Payload. Не работает через тоннель.
- ❌ Свой `useDrawer` хук вместо `DetailDrawer` примитива — нарушение R9 (есть готовое — переиспользуй).
- ❌ Хранить состояние модалки в `useState` без hash — модалка не шарится, не реоткрывается, ломает back.
- ❌ Открывать модалку без `<a href>` (только `onClick` на `<button>`) — без JS / Ctrl+клик ничего не работает, SEO=0.
- ❌ Server-component внутри `'use client'` Root'а — невозможно технически, не пытайся «как-то протащить».
- ❌ Открывать модалку другой сущности из текущей через JS — лучше закрыть текущую и `openDetail` новую (history-stack корректнее).
- ❌ Несколько Root'ов одного типа на странице — один экземпляр в `app/layout.tsx`, всё.

## Прецеденты (живые в репо)

- `DogDetailDrawer.tsx` + `/internal/dog/[slug]/route.ts` — карточка собаки на /news, при клике на чип-кличку
- `DetailDrawer.tsx` — generic-каркас (используется всеми drawer'ами)
- `SocialLikePopupRoot.tsx` — родственный паттерн для попапа лайкнувших (другой entity, другой триггер `data-like-popup`)

## Связанные правила

- **R15** в `holygrail-rules` — client-fetch только same-origin через `/internal/*`. Это фундамент работы модалок через demo-tunnel и прод-домены.
- **R14** — `'use client'` оправдан для Root'ов (нужен hashchange listener + click перехватчик). Body можно делать без `'use client'` — но в текущем каркасе он inline в Root, так что весь компонент `'use client'`.
- **R13** — каждой сущности canonical URL (`/dog/<slug>`, `/litter/<letter>`). Модалка — overlay поверх этого URL, не замена.
- **`holygrail-layouts → Drawer-канон`** — про **навигационные** drawer'ы (NavDrawer, sidebar) в `SiteLayout.panels[]`. Не путать с detail-модалками этого скилла.
