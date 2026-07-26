# Seed assets — placeholders

> Файлы которые `createHomePage.ts` загружает в Media-коллекцию Payload через Local API при первом seed'е минимального инстанса. Payload + `@payloadcms/storage-s3` плагин **автоматически** сольёт их в S3 при upload (MinIO в dev, любой S3-совместимый bucket в prod).

## Состав

| Файл                    | Назначение                                   | Где используется в layout |
| ----------------------- | -------------------------------------------- | ------------------------- |
| `whg-logo.svg`          | Квадратный логотип-placeholder (256×256)     | `SiteSettings.logo`       |
| `whg-hero.svg`          | Hero-фон (1920×1080), dark + accent gradient | `Hero` block в home page  |
| `feature-stack.svg`     | Иконка «opinionated stack» (64×64)           | FeatureGrid item          |
| `feature-growth.svg`    | Иконка «side-scaling growth» (64×64)         | FeatureGrid item          |
| `feature-contracts.svg` | Иконка «contracts seam» (64×64)              | FeatureGrid item          |
| `og-placeholder.svg`    | OG image для соцсетей (1200×630)             | `SiteSettings.ogImage`    |

## Зачем SVG, не JPG/PNG

- **Малый размер.** Векторы 1-5 KB вместо 100-500 KB JPG. Не раздувают git history.
- **Чёткие при scaling.** Логотип одинаково чётко на retina и low-res без variants.
- **Редактируемые.** Цвета берутся из tokens-палитры — заменяя placeholder реальной картинкой через /admin, видно какие токены использовать в дизайн-системе сайта.
- **Заменимы.** Payload Media accept'ит любые форматы — владелец загружает реальное JPG/PNG/WebP через /admin Media UI, references в Pages автоматически подхватывают новые ID.

## Замена в production

После scaffold нового downstream-сайта:

1. Открыть `/admin/collections/media` в браузере (после login)
2. Найти `whg-logo.svg`, `whg-hero.svg` и т.д. (или искать по prefix `placeholder/`)
3. Click → Edit → Replace file → Upload реальная картинка
4. `updatedAt` обновляется → cache-bust hook добавляет `?v=<ts>` к URL → CDN отдаёт свежий файл

References в Pages **не нужно перепривязывать** — они хранят Media ID, а не URL.

## Соответствие R-rules

- **R1 (контент в БД).** Это **не контент**, это seed-default который заменяется через /admin. После замены — реальные значения хранятся в Payload + S3.
- **Не хардкод.** Никаких `<img src="/whg-logo.svg" />` в JSX — все references идут через Media ID из `SiteSettings` / `Page.blocks[*].data.image`.
