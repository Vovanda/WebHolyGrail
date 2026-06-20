---
name: holygrail-ui-reference
description: Workflow проектирования и реализации UI в Web Holy Grail-сайтах. Дефолт — я сам дизайнер, набираю насмотренность через WebSearch (awwwards/dribbble/pinterest), активирую frontend-design skill, делаю чистый production-grade UI без shadcn-дефолта. Если у заказчика есть существующий сайт / макет (как у veo55 — повезло) — копирую с улучшениями + face-off через Playwright. UI-механики (carousel/dnd/form/picker) — opensource, не велосипед. Триггерить при создании любого блока / страницы / визуальной композиции.
---

# Skill: holygrail-ui-reference

> Я и есть дизайнер. В большинстве будущих сайтов Holy Grail-категории (микробизнес: автосервис, кофейня, клиника, питомник) у заказчика **не будет** макета и часто не будет даже старого сайта — будут тексты, фото, идея.

> Web Holy Grail — фреймворк для **серии сайтов**. Этот skill — про универсальный workflow UI. Конкретика отдельного клиента (бренд, существующий сайт, путь к материалам) — в `<site>-context` skill (для veo55 — `veo55-context`).

## Два режима работы (по тому что дал заказчик)

### Режим A — заказчик дал референс (повезло)

Сценарий: существующий клиентский сайт / Figma-макет / детальные скрины. Пример сейчас — **veo55**: старый Joomla-сайт + локальный архив + скрины. Задача — **«точно скопировать с улучшениями»**.

В этом режиме:

1. Открыть его референс (live URL через Playwright / локальный архив — см. `<site>-context`)
2. Тексты и данные **1:1**
3. Композиция **узнаваемая** (тот же порядок секций)
4. Дизайн **современнее**: refined typography, выверенная сетка, бренд-палитра клиента, refined disclosure/бейджи/карточки
5. Face-off через Playwright скрин-в-скрин до коммита

### Режим B — заказчика тексты/фото/идея (норма для фреймворка)

Сценарий: «сделай мне сайт для автосервиса / клиники / кофейни». Макета нет, старого сайта нет или он 2010 года и его не копируем. **Я проектирую сам**.

В этом режиме:

1. Понять бизнес-задачу заказчика (что продаёт, кто клиент, action на сайте — звонок / запись / заказ)
2. Насмотренность ДО кода:
   - `WebSearch('<тип-бизнеса> website design awwwards 2026')`
   - `WebSearch('<нужная-секция> hero/pricing/contact dribbble 2026')`
   - 10-15 примеров, `WebFetch(top-3-5)` для разметки и идей
3. **Обязательно** активировать skill `frontend-design` — это его профильная задача: «production-grade frontend interfaces with high design quality, avoids generic AI aesthetics».
4. Бренд-палитру выбираю сам исходя из бизнес-категории / тонов заказчика, согласовываю с заказчиком (через Володю). Source of truth — `tokens.css` сайта.
5. Композицию проектирую с нуля под бизнес-задачу, не «как у конкурента».

**В обоих режимах:** без открытого референса / без насмотренности / без `frontend-design` skill = автоматический shadcn-дефолт (`rounded-xl bg-surface shadow-md` серый плейсхолдер). Это позор.

## Когда триггерить

- Создаёшь новый UI-блок / страницу / секцию
- Переносишь существующую секцию с оригинала заказчика (режим A)
- Проектируешь с нуля (режим B)
- Заказчик описал баг короткой фразой («не так», «нет тени») — режим A: resolve через его оригинал; режим B: уточни что значит, не угадывай
- Перед коммитом UI — face-off (режим A) или само-ревью (режим B)
- Используешь сторонний UI-механизм — проверь opensource (см. ниже)

## Resolve user wording (режим A)

Заказчик короткой фразой описывает баг — он смотрит на свой живой сайт, фраза описывает **разницу**.

- «контент без тени на фон» → у нас НЕТ тени, а должна быть как в оригинале. НЕ «убери тень».
- Перед правкой по короткой фразе — открыть его CSS / HTML, найти селектор.

## Face-off перед коммитом (режим A, через Playwright)

```
browser_resize(1920×1080)
browser_navigate('<client-live>/<page>') → take_screenshot  # оригинал
browser_navigate('http://localhost:3000/<page>') → take_screenshot  # мой
# side-by-side; повторить для 768 и 375
```

Скриншоты в `.tmp/recon/orig-<секция>-<viewport>.jpeg` / `ours-<секция>-<viewport>.jpeg`.

Расхождения → правка → повтор. До момента когда расхождения = осознанно-намеренные («мы сделали лучше»).

## Self-review перед коммитом (режим B)

- Скриншот в `.tmp/recon/ours-<секция>-1920.jpeg` / `-768.jpeg` / `-375.jpeg`
- Сверка с насмотренностью: «это лучше / на уровне топ-3 примеров с awwwards?»
- Проверка чек-листа: токены вместо hex / нет shadcn-дефолта / есть hierarchy / motion на месте / accessibility пройдёт базовый аудит / mobile дышит

Если не уверен — задаю Володе вопрос с скрином, не коммитаю.

## Skills checklist (активировать ДО кода)

| Задача                                          | Skill                                          |
| ----------------------------------------------- | ---------------------------------------------- |
| UI / новый блок / визуальная композиция         | `frontend-design` (обязателен в обоих режимах) |
| Меняешь Payload-коллекцию/блок/global           | `payload-migration`                            |
| Кропать фото в карточках/превью                 | site-specific (для veo55 — `veo-photo-crop`)   |
| Меняешь SiteLayout / panels / slots             | `holygrail-layouts`                            |
| Любой архитектурный выбор                       | `holygrail-rules`                              |
| Конкретика текущего сайта (бренд, пути, скрины) | `<site>-context` (для veo55 — `veo55-context`) |

Skill applicable, но не вызван = автоматический фак-ап.

## Инструменты — не из памяти

Память по UI и API библиотек врёт. За полгода Tailwind мажорит, Next App Router меняется, Payload эволюционирует.

| Что                 | Когда                                                             | Tool                                                                                                                                                |
| ------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Playwright MCP**  | Перед/после UI-блока, face-off, проверка рендера                  | `browser_resize` → `browser_navigate` → `browser_take_screenshot`. Также `browser_snapshot`, `browser_console_messages`, `browser_network_requests` |
| **WebFetch**        | Перед вызовом метода чужой библиотеки                             | `WebFetch(url:'https://payloadcms.com/docs/<topic>', prompt:'...')`. Не «помню что у Payload это X»                                                 |
| **WebSearch**       | Новая секция (режим B всегда) / непонятный паттерн / live-примеры | `WebSearch('<тип> design awwwards 2026')`, `WebSearch('<lib> <version> <api> example')`                                                             |
| **Agent (Explore)** | Широкий поиск по кодбазе                                          | Когда не уверен где паттерн уже использовался                                                                                                       |
| **async-workflow**  | Длинная multi-step research                                       | Background-агент через `/async-workflow` skill                                                                                                      |

### Канонические URL доки (через WebFetch, не из обучения)

- Payload 3.x — https://payloadcms.com/docs
- Next 15 App Router — https://nextjs.org/docs/app
- Tailwind v4 — https://tailwindcss.com/docs
- shadcn/ui — https://ui.shadcn.com/docs
- Embla Carousel — https://www.embla-carousel.com/api
- react-hook-form — https://react-hook-form.com/docs
- Drizzle ORM — https://orm.drizzle.team/docs
- Lucide Icons — https://lucide.dev/icons
- Sharp — https://sharp.pixelplumbing.com/api-constructor

## UI-механики — opensource, не велосипед

| Что             | Возьми                                             |
| --------------- | -------------------------------------------------- |
| Carousel        | `embla-carousel-react` + `embla-carousel-autoplay` |
| Touch-gesture   | `@use-gesture/react`                               |
| Forms           | `react-hook-form` + `zod`                          |
| DnD             | `@dnd-kit/core`                                    |
| Date picker     | `react-day-picker`                                 |
| Tables          | `@tanstack/react-table`                            |
| Animations      | `motion` (Framer v12+)                             |
| Markdown        | `react-markdown` + remark/rehype                   |
| Rich text       | `@tiptap/react` или Lexical                        |
| Modals/popovers | `@radix-ui/react-*` (через shadcn copy)            |
| Combobox        | `cmdk`                                             |
| Charts          | `recharts` или `@nivo/*`                           |
| Virtual scroll  | `@tanstack/react-virtual`                          |

Велосипед только если: opensource нет / >50kb для landing / несовместимая лицензия / концептуально не подходит.

shadcn copy в `components/ui/` — наш паттерн (тонкий слой над Radix/Embla/cmdk, стилизуем под наши tokens).

## Бренд и токены — site-specific

Конкретные значения цветов / отступов / шрифтов конкретного сайта — **не сюда**. Они живут:

- **`sites/<site>/src/client/styles/tokens.css`** — source of truth (CSS-переменные)
- **`<site>-context` skill** — описание бренда в человеческом виде (для veo55 — `veo55-context`)

Этот skill — про **методологию** UI, не про конкретные цвета.

## Маркеры плохой работы

- В режиме A: коммитнул без face-off → «поверил себе»
- В режиме B: написал без насмотренности / без `frontend-design` → shadcn-дефолт
- `bg-[#hex]`, серый плейсхолдер «фото скоро», generic shadcn-вид → reference не открыл / не подумал
- Накатал свой Carousel вместо Embla → не проверил opensource
- «Помню что у Payload это `payload.find({where:{...}})`» без проверки доки → пиздёж с умным видом
- В режиме B: «у заказчика нет референса, поэтому делаю как умею» без насмотренности → лень, не работа
