---
name: veo55-context
description: Конкретика клиента veo55 (питомник немецких овчарок Ольги Зайцевой) — путь к локальному архиву легаси-сайта, бренд-палитра, скриншоты секций, текущий layout сайта, доменные сущности (Dogs/Litters/Puppies/Owners). Триггерить когда работаешь по sites/veo55/, переносишь секцию с veo55.ru, выбираешь цвет/токен для блока veo55, смотришь на оригинал.
---

# Skill: veo55-context

> Site-specific контекст. Применяй когда trogаешь `sites/veo55/`. Общие правила фреймворка — в `holygrail-*` skills.

## Когда триггерить

- Работаешь по `sites/veo55/**`
- Переносишь / правишь секцию с оригинала veo55.ru
- Выбираешь цвет / отступ / шрифт для блока veo55 (бренд-палитра ниже)
- Нужен путь к локальному архиву легаси-сайта
- Доменная сущность питомника (Dogs / Litters / Puppies / Owners)

## Заказчик

**Ольга Зайцева** — кинолог, владелица питомника немецких овчарок veo55.ru. Запрос: «отвяжите от Joomla, визуально можно копию текущего сайта; если переведёте на современные компоненты — отлично». Ольга получает сайт **попутно** — приятный побочный эффект, не главная мотивация (главная — собрать `_template` из veo55 для следующих сайтов).

## Локальный архив легаси

`C:\Users\SawKing\Documents\ClaudeProjects\veo55\`

- `src/articles/*.html` — живая разметка секций (main / news / faq / catalog)
- `src/assets/veo-ui.css` — реальные классы и стили
- `*.png` / `*.jpeg` в корне — скриншоты версий:
  - `puppies-desktop-full.png`, `puppies-v3-desktop.png`, `puppies-v4-desktop.png`, `puppies-v5-desktop.png` — секция щенков
  - `puppies-mobile.png` — мобильная версия щенков
  - `main-1920-puppies.png` — главная на 1920
  - `main.html` — главная разметка
- `memory/credentials.md` — креды SSH/Joomla REST/VK (для миграции — см. `veo55-migration` skill)

Локальный архив может **отставать от live** — `https://veo55.ru/` важнее. Сверяться через Playwright MCP.

## Бренд-палитра

Source of truth — `sites/veo55/src/client/styles/tokens.css`. Никаких hex в коде блоков (R2).

| Токен      | Цвет              | Назначение                     |
| ---------- | ----------------- | ------------------------------ |
| `--bg`     | cream `#F8F2E7`   | фон (НЕ белый)                 |
| `--ink`    | шоколад `#2B221A` | основной текст                 |
| `--accent` | янтарь `#D4A437`  | CTA, акцент-слово в h1, ссылки |
| `--muted`  | taupe `#7A6F5F`   | вторичный текст                |

### Запреты по бренду

- ❌ Красный, оливковый, тёмный лес, розовый бежевый
- ❌ Чисто белый фон (`#FFF`)
- ❌ Grayscale на забронированных щенках («траур какой-то»)
- ❌ Любые hex прямо в JSX (R2)

### Воздушность

- Между секциями: 32px (mobile) / 48-56px (desktop)
- Padding карточек: 24-32px
- Line-height: 1.6-1.7
- Border-radius: 8-12px

«Карточки должны дышать».

## Текущий layout сайта (CLASSIC_VEO55_LAYOUT)

Live в `client/src/layouts/presets/classic-veo55.ts`. Композиция через `holygrail-layouts`:

- `top` → Header (узкий, лого + телефон + соц-иконки, sticky)
- `right` → NavDrawer (sticky burger top-4 right-4, drawer 280px) **по дефолту справа** (правши, большой палец на мобиле)
- `center` (size=wide) → PageOutlet (page.blocks[] напрямую, каждый блок сам wrapper)
- `bottom` → Footer

Добавление категорий собак / TOC по странице — `slot: 'left'` через симметричный drawer (NavDrawer переиспользуется с `side: 'left'`).

## Доменные сущности (нишевая часть)

В Payload `cms/src/collections/`:

- **`Dogs`** — собаки питомника (взрослые + щенки уже выросшие)
- **`Litters`** — помёты (группа щенков от одной пары родителей)
- **`Puppies`** — щенки (привязаны к Litter)
- **`Owners`** — владельцы взрослых собак (для родословной)

В `client/blocks/niche/` (R5++ — почти пустая): только то что **реально** не обобщается. Дефолт — функциональные имена в `content/`: `EntityCard` для собаки, `EntityPair` для пары родителей, `EntityGrid` для помёта.

PR-блокер: блок-файл с именем `Dog*` / `Litter*` / `Puppy*` без явной аргументации почему не обобщили.

## Секреты и dev-стек

Infisical **НЕ установлен**, секреты в `.env.local` (gitignored) — см. memory `project_secrets_setup.md`. Поднять стек:

```bash
./dev-setup.sh    # первый раз — создаёт .env.local
./dev.sh          # каждый раз после: CMS :3001, Admin :3001/admin, Client :3000
```

Если пересоздать `.env.local` с новым `PAYLOAD_SECRET` — существующие JWT-сессии инвалидируются (перелогин в /admin). bcrypt-пароль остаётся валидным.

## SQLite база

`sites/veo55/src/cms/data/veo55.db`. Миграции — через `payload-migration` skill, **никогда** `rm db` ради «починить миграцию».

## Что НЕ делать с легаси

`C:\Users\SawKing\Documents\ClaudeProjects\veo55\` — только источник (Read). Прод veo55.ru тоже только Read (Playwright / WebFetch). Не пушить туда, не трогать БД, не править файлы. Деплой нового сайта — на отдельный VPS / endpoint, не поверх старого.
