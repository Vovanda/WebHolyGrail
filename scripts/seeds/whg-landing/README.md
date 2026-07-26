# Seed: whg-landing

Витрина самого Web Holy Grail. **Только для whg.sawking.tech** — стороннему сайту этот пресет ставить не нужно, ему хватает [`minimal`](../minimal/README.md).

## Правило (#72)

Хардкод WHG допустим только на собственной главной странице WHG. На сайте инстанса после `seed:minimal` не должно остаться ни одной ссылки на движок, кроме подписи «Built on Web Holy Grail» в футере (ведёт на whg.sawking.tech).

## Что создаёт

- **Initial admin user** — та же логика что в `minimal` (переиспользуем `createInitialAdmin`).
- **SiteSettings движка** — `siteName`, логотип `whg-logo.svg`, mainNav, контакты, тема. Обновляется только если `siteName` пустой или дефолтный, правки из админки не затираются.
- **Главная-лендинг** — `slug=home` со всеми блоками витрины (hero-split, install-snippet, stack-transparency, comparison-table, feature-grid, built-with, project-types-grid, quote, block-showcase, cta-banner).
- **FAQ** — группы «Бизнесу» / «Разработчикам» / «Технологии и ресурсы», страница `/faq` и пункт в mainNav.

Идемпотентно: media реюзаются по filename, страница с непустыми блоками не трогается, существующие FAQ-группы не перезаписываются.

## Запуск

```bash
# из корня репо
pnpm seed:whg-landing
```

Force-флаги для итерации копирайта:

- `SEED_FORCE_HOME=1` — перезаписать лендинг даже если блоки уже есть
- `SEED_FORCE_FAQ=1` — перезаписать существующие FAQ-группы
- `SEED_FORCE_FAQ_PAGE=1` — перезаписать блоки страницы `/faq`

## На проде

`deploy/prod/deploy.sh` гоняет пресет из `SEED_PRESET` (по умолчанию `minimal`). Для whg.sawking.tech в его `.env.production`:

```
SEED_PRESET=whg-landing
```

## Где живёт код

- `scripts/seeds/whg-landing/` (тут) — README.
- `src/cms/src/seed/whg-landing/` — ts-скрипты + `assets/` (логотип, скриншоты, og-картинка).
- Корневая команда `pnpm seed:whg-landing` делегирует через `pnpm --filter cms run seed:whg-landing`.
