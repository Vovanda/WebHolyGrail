<!-- mcp-project: HolyGrail -->

# Agent instructions

> Этот проект — сайт на базе **Web Holy Grail** (Next 15 + Payload 3 + contracts seam + Docker + Infisical). Гибкая архитектура: сайт растёт вместе с бизнесом через `blocks/domain/<niche>/` + новые collections + routes — без переписывания. Описание самого проекта (что за сайт, что он делает) — в [`README.md`](README.md). Архитектурная документация — в [`docs/whg/`](docs/whg/).

## При старте сессии

Прежде чем что-то делать — **детект, на чём ты находишься**:

```bash
# 1. Имя репо (приоритет если git remote есть):
gh repo view --json name 2>/dev/null | jq -r .name
# или из git remote:
basename -s .git "$(git remote get-url origin 2>/dev/null)"
# fallback — basename корневой папки:
basename "$(pwd)"
```

Дальше:

- **Если имя ∈ `{WebHolyGrail, web-holy-grail}`** — это **upstream template**. README описывает framework, активны maintainer-правила (см. внизу).
- **Если имя что-то другое** (например `sawking-tech`, `cafe-zerno`, `clinic-vita`) — это **downstream instance**. README, склонированный из template, скорее всего описывает framework, не этот конкретный сайт. **Проактивно** в первом ответе предложи:
  > «Этот репо называется `<name>`. README пока описывает Web Holy Grail. Если этот сайт не WHG, расскажи в одной фразе чем он занимается, и я обновлю README + CLAUDE-секцию под него.»
  Не lecture, не настойчиво — одно предложение, ждёшь ответа. Если пользователь скажет «не сейчас» / проигнорирует — продолжай работу как обычно.
- **Если есть `.template-version` в корне** — это однозначный маркер инстанса (после `sync-template.sh`).

## Принципы (R0–R15 кратко)

Полный список — [`docs/whg/30-philosophy.md`](docs/whg/30-philosophy.md). Самое важное:

- **R0** — Контент в БД (Payload), не в коде. Меняется без deploy.
- **R3** — `client/` ↔ `cms/` только через `contracts/`. Никаких прямых импортов.
- **R4** — Side-scaling. Новая фича = новый `blocks/domain/<niche>/` + collections + routes в этом же репо.
- **R5++** — Именование функциональное (`EntityCard`, не `DogCard`).
- **R9** — Обобщение снизу вверх (не делать generic-`Card` до 2-3 живых niche-карточек).
- **R14** — SSR по умолчанию. `'use client'` только для DOM/browser API.

Перед архитектурным выбором — активируй skill `holygrail-rules`.

## Где что живёт

| Что | Где | Почему |
|---|---|---|
| Секреты (PAYLOAD_SECRET, S3 keys, DB URL с паролем) | Infisical Cloud | Никогда в git |
| Env-dependent runtime (S3_BUCKET, NEXT_PUBLIC_*, ALLOWED_ORIGINS) | Infisical Cloud | Меняется dev/staging/prod без deploy |
| Бренд + контент (siteName, contacts, mainNav, theme) | Payload `SiteSettings` global | R0 — менеджер сайта редактирует без разработчика |
| Доменные сущности | Payload collections (`src/cms/src/collections/`) | R0 |
| Build-time константы (feature flags) | `src/client/src/config.ts` | Никогда не меняется в runtime |

**Принцип:** если можешь поменять без deploy кода — в Infisical (если env-dep) или Payload (если контент). Если только с релизом — в коде.

## Skills (триггерить при попадании в зону)

| Skill | Когда |
|---|---|
| `holygrail-rules` | Архитектурный выбор: блок / contracts / collection / URL-схема |
| `holygrail-layouts` | SiteLayout / PanelConfig / Header/Footer/NavDrawer |
| `holygrail-modals` | Detail-модалка сущности (карточка с overlay) |
| `holygrail-ui-reference` | Создаёшь UI-блок / страницу / визуальную композицию |
| `holygrail-infisical` | Секреты — bootstrap, ротация, новая env-переменная |
| `holygrail-template-sync` | Подтянуть upstream WHG generic |
| `holygrail-scaffold` | (upstream only) — создание нового инстанса |
| `payload`, `payload-jobs`, `payload-migration` | Payload — collections, fields, hooks, миграции, jobs |
| `frontend-design` | UI с дизайн-усилиями |

## Что НЕ делать

- Хардкод контента на фронте (R0)
- Прямые импорты `cms/` → `client/` (R3)
- Доменные имена базовых блоков (R5++)
- `bg-[#hex]` / inline-color (R2 — токены)
- Деструктив на prod без явного «ок»
- Изобретать обобщения раньше второго случая (R9)
- Создавать новые репо для sub-products одной компании — растим в этом же (R4)

## Stop-conditions

- Архитектурная развилка (новая модель данных, breaking contract, выбор стека)
- Зацикливание — один fix не работает второй раз подряд
- Деструктив на shared/prod
- Что-то выглядит подозрительно

## Память

- MCP `HolyGrail/session/active`, `HolyGrail/plan/PLAN`
- Project memory: `~/.claude/projects/<sanitized-path>/memory/MEMORY.md`
- Skills: `.claude/skills/<name>/SKILL.md`

---

## Только в upstream WHG (`Vovanda/WebHolyGrail`)

Применимо когда detect показал что это template, не инстанс:

- Это **шаблон**, не сайт. Никаких domain blocks / collections / routes / бизнес-контента. Корень = generic скелет для всех будущих инстансов.
- Изменения здесь распространяются через `sync-template.sh` в инстансы. Думай как изменение приземлится.
- `scripts/seeds/` пополняется по project types (`minimal` сейчас, `business-card`/`blog`/`portal` в roadmap).
- **Skill + docs парные** — `.claude/skills/holygrail-<X>/SKILL.md` ↔ `docs/whg/<num>-<x>.md`. При апдейте править оба.
- При scaffold нового инстанса — Claude замечает имя репо ≠ WHG и предлагает обновить README (это поведение описано выше).
- Перед merge крупного refactor'а — scaffold тестовый инстанс из ветки и убедись что `./dev.sh` стартует.
