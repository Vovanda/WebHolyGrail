# Архитектура компонентов и подготовка к библиотеке

> Документ-план. Текущая структура → целевая 4-уровневая → шаги перехода. Все правки делаем **сначала в WHG**, оттуда портируем в `sites/veo55/` (template-first).

## Цель

Подготовить структуру компонентов так, чтобы:

1. Каждый компонент жил на **своём уровне абстракции** (атом / молекула / структура / домен).
2. Под **вариации одного компонента** (CarouselRows, CarouselFade, CarouselThumbnails) была готовая папка-контейнер, не один файл.
3. Вариации различались **дизайн-тегами** (layout-x, design-y) для будущего визуального конструктора.
4. По мере накопления компоненты безболезненно extract'ятся в `@holygrail/ui` пакет.

## Текущее (диагностика)

```
src/client/src/
├── blocks/
│   ├── primitives/        # переиспользуемые: Carousel.tsx, Hero.tsx, FAQ, ...
│   │   └── social/        # подгруппа
│   ├── content/           # ⚠️ layout (Header/Footer/NavDrawer) — имя путает
│   ├── system/            # PageOutlet
│   ├── decor/             # ContentFrame
│   └── veo55/             # доменные: dogs/, litter/
└── components/            # ⚠️ ДУБЛИРУЕТ blocks
    ├── PawTrail.tsx        # универсальный → должен быть в blocks/decor
    ├── SocialIcon.tsx      # универсальный → blocks/primitives
    ├── catalog/, dog/, faq/  # доменные → blocks/veo55
```

**Проблемы:**

- Две папки (`blocks/` и `components/`) для компонентов — нет правила куда класть.
- Карусель **один файл** — нет архитектуры под вариации.
- `content/` для Header/Footer — путаное имя.
- Нет уровня **shadcn-атомов** (`ui/`).
- `veo55/` смешан с тем что может обобщиться (PuppyCard ≈ ItemCard).

## Целевая структура

```
src/client/src/
├── ui/                          # L1 АТОМЫ — shadcn-примитивы (button, input, dialog, badge...)
│   └── (копируются `shadcn add`, никакого бизнеса)
├── blocks/
│   ├── primitives/              # L2 МОЛЕКУЛЫ — переиспользуемые универсальные блоки
│   │   ├── Carousel/            # ← директория, не файл — поддерживает вариации
│   │   │   ├── index.ts         # default export + общий тип
│   │   │   ├── types.ts         # CarouselProps интерфейс
│   │   │   ├── CarouselRows.tsx # default (translateX rows)
│   │   │   ├── CarouselFade.tsx # будущая
│   │   │   └── README.md        # дизайн-теги и когда какой вариант брать
│   │   ├── Hero/                # тот же паттерн
│   │   ├── FAQ/, Quote/, Timeline/, ...
│   │   └── social/              # подгруппа SocialPostCard, ...
│   ├── layout/                  # L3 СТРУКТУРНЫЕ — Header, Footer, NavDrawer (бывший content/)
│   ├── decor/                   # L3 декоративные — ContentFrame, PawTrail, WaveDivider
│   └── domain/                  # L4 ДОМЕННЫЕ — заточенные под бизнес
│       └── veo55-kennel/        # бизнес-ниша (питомник)
│           ├── dogs/            # DogCard, DogDetailDrawer, DogProfile, DogProfileCompact
│           ├── litter/
│           └── catalog/         # CatalogSearchForm (РКФ-поиск)
├── lib/                         # утилиты, адаптеры, dog-profile/, api-client, ...
├── layouts/                     # site-layout, block-registry
└── app/                         # Next routes
```

## Дизайн-теги вариаций

Каждый вариант компонента помечается **тегами в JSDoc** (и в `index.ts` re-export):

```ts
/**
 * CarouselRows — горизонтальная карусель через translateX.
 *
 * @tags layout: rows | design: minimal | motion: slide-transition
 * @when default; контент-баннеры, photo-grid, single-aspect
 * @notWhen смешанные aspect (нужен contain без letterbox) — используй CarouselFade
 */
```

**Категории тегов:**

- `layout:` — rows | fade | thumbnails | grid-overlay
- `design:` — minimal | rich | brutalist | hand-drawn
- `motion:` — slide-transition | crossfade | none | gpu-3d
- `interaction:` — swipe | arrows | dots | autoplay
- `device:` — mobile-first | desktop-first | both

Цель тегов: когда библиотека вырастет, разработчик/Claude/Володя выбирает вариант по интенту («нужно лайт-минимал с свайпом для мобилки») а не по случайному имени.

## Шаги перехода (порядок, для следующих сессий)

### Шаг 1 — каркас вариаций для Carousel (опорная точка)

1. Создать `blocks/primitives/Carousel/` директорию.
2. Перенести `Carousel.tsx` → `Carousel/CarouselRows.tsx`.
3. Создать `Carousel/types.ts` с общим `CarouselProps` интерфейсом.
4. Создать `Carousel/index.ts` с re-export'ами + дефолтным `export { CarouselRows as Carousel }`.
5. Создать `Carousel/README.md` с дизайн-тегами и сравнением вариантов.
6. Все существующие `import { Carousel } from '@/blocks/primitives/Carousel'` остаются — `index.ts` дефолт-экспортит `CarouselRows`.

### Шаг 2 — то же для других потенциально вариативных

Hero, Quote, FAQ, Timeline, PhotoLightbox, PedigreeTree — если есть подозрение что появятся вариации. Помечаем JSDoc-тегами **без** выноса в директорию, пока вариаций нет.

### Шаг 3 — refactor имён папок

- `blocks/content/` → `blocks/layout/` (Header/Footer/NavDrawer).
- `blocks/system/` оставить.
- `blocks/decor/` оставить.

### Шаг 4 — миграция `components/` → `blocks/`

- `components/PawTrail.tsx` → `blocks/decor/PawTrail.tsx`
- `components/SocialIcon.tsx` → `blocks/primitives/SocialIcon.tsx`
- `components/catalog/` → `blocks/domain/veo55-kennel/catalog/`
- `components/dog/` → `blocks/domain/veo55-kennel/dogs/` (или в `blocks/primitives/dog/` если станет универсальным для других сайтов)
- `components/faq/FaqToggleAllButtons.tsx` → `blocks/primitives/FAQ/` (рядом с FaqAccordion)

### Шаг 5 — пустой каркас `src/ui/`

Создать `src/ui/` директорию с пустым README — место под будущие shadcn-атомы. `pnpm dlx shadcn add button` будет класть сюда.

### Шаг 6 — обновить все импорты

Глобальный find/replace по `@/components/...` → новые пути. ESLint-плагин boundaries (если будет) — добавить правило «`blocks/primitives/` не импортит из `blocks/domain/`».

### Шаг 7 — синхронизация в production veo55-site

После того как WHG `sites/veo55/` стабилизирован — портируем те же изменения в `veo55-site` через **отдельные PR'ы** в production-репо (по 1 шагу на PR чтобы не разнести).

## Порядок репозиториев

**WHG-first → veo55 после.** WHG — template snapshot для будущих сайтов. Изменения архитектуры там безопаснее (не прод). После стабилизации портируем в veo55-site (production) теми же PR'ами.

Это противоречит обычному feedback `feedback_sync_veo55_to_whg.md` («любая правка veo55 сразу в WHG»). **Исключение для архитектурных refactor'ов** — направление обратное: WHG → veo55.

## Комментарии в коде

Везде где сейчас компонент **может** позже разрастись в вариации — пометка JSDoc:

```ts
/**
 * Carousel — единая публичная точка.
 *
 * @libraryNote Заготовлено под будущую библиотеку @holygrail/primitives.
 *   Если появится `CarouselFade` / `CarouselThumbnail` — вынесем `Carousel.tsx`
 *   в `Carousel/` директорию с подвариантами (см. `docs/whg/39-component-architecture.md`).
 */
```

Эта пометка — сигнал «не превращай в монолит с 30 пропсами; следующая вариация = отдельный файл-компонент».

## Не делать до полной готовности

- Не extract'ить ничего в `packages/_template/` или `@holygrail/ui` сейчас. Сначала refactor локальной структуры в WHG `sites/veo55/`. Когда там устаканится — отдельным шагом extract.
- Не вводить `boundaries` ESLint-плагин сейчас — пока структура не зафиксирована, правила гонять рано.
- Не создавать пустые `Hero/` `FAQ/` директории «авансом» — Carousel вынести первым, остальные по факту появления вариации (R9: абстракция следует за опытом).
