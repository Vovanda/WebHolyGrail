---
name: whg-skill-authoring
description: Как писать и обновлять наши собственные skills для Holy Grail (`whg-*`). Naming convention с префиксом `whg-`, когда писать inline vs референсить на внешние skills (payload/, infisical-*, cms-migration), как симметрить skill ↔ docs/whg/, что должно быть во frontmatter, когда добавлять reference/ подкаталог. Триггерить когда создаёшь новый skill для WHG / обновляешь существующий / делаешь refactor имён / решаешь "это уникальное для WHG или достаточно сослаться на внешний".
---

# Skill: whg-skill-authoring

> Meta-skill: как писать и обновлять наши собственные `whg-*` skills.

## Когда триггерить

- Создаёшь новый skill для WHG-specifics
- Refactor имени skill'а или его сферы
- Спор «это уникальное для WHG или достаточно сослаться на внешний skill»
- Решаешь: писать inline весь процесс или ссылаться на огромный внешний skill
- Onboarding: ты в первый раз правишь `.claude/skills/whg-*/SKILL.md` файл

## Naming convention — обязателен префикс `whg-`

Все наши skills именуются `whg-<topic>`. Это:

- Отделяет **наше** от **скачанного официального** (`payload`, `cms-migration`, `infisical-*`).
- Помогает AI-инструменту читать сначала **наши** project-specific skills (приоритет), потом внешние (контекст).
- Защищает от конфликтов имён при добавлении новых внешних skills.

| Тип                   | Префикс                       | Примеры                                                                                                                                                            |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Наш (WHG-specific)    | **`whg-`** обязателен         | `whg-rules`, `whg-layouts`, `whg-modals`, `whg-infisical`, `whg-template-sync`, `whg-scaffold`, `whg-payload-jobs`, `whg-payload-migration`, `whg-skill-authoring` |
| Скачанный официальный | без префикса (имя поставщика) | `payload`, `cms-migration`, `infisical-setup`, `infisical-self-host`, ...                                                                                          |

**Никогда** не называй наш skill без префикса — будет путаться с потенциальным официальным от вендора с тем же именем.

## Уникальность содержания: inline vs reference

Наши `whg-*` skills бывают двух типов по содержанию:

### Type A — Уникальный (наша специфика)

Skill описывает **процесс/правило/паттерн которого нет в официальных** или который у нас **значительно отличается**.

Примеры:

- `whg-rules` — R0-R15 — это наш rule-set, нигде нет.
- `whg-layouts` — наша Panel/Slot/SiteLayout архитектура.
- `whg-modals` — наш канон detail-модалок с hash-routing.
- `whg-scaffold` — наш scaffolding flow (gh repo create → setup-infisical → ./dev.sh).
- `whg-template-sync` — наш upstream → instance sync workflow.

**Содержание:** всё inline, никаких ссылок «см. внешний skill». Это **наш** контент.

### Type B — Референсный (наш-flavored поверх внешнего)

Skill описывает **наш стиль использования** внешнего инструмента. Detail process — в официальном skill, у нас только **delta** (как мы это применяем).

Примеры:

- `whg-payload-jobs` — мы используем Payload Jobs Queue **наш способ** (наши паттерны для VK sync, импорта, periodic checks). Generic Jobs Queue API — в официальном `payload-jobs` (если есть) или в `payload` skill (раздел Jobs).
- `whg-payload-migration` — миграции Payload **в нашем blue-green deploy.sh** (специфический workflow). Generic migrations — в `payload`.
- `whg-infisical` — наш workflow (self-host single instance + project per site + REST automation). Generic — в `infisical-setup`, `infisical-self-host`.

**Содержание:**

- В начале — **что у нас специфично** (наш паттерн, наш flow)
- Ссылка на официальный skill: `См. также `payload`skill для базы /`infisical-self-host` для deploy`
- **Inline** только то что у нас отличается от generic подхода
- Если внешний skill маленький (1 короткий файл) — можно inline-копию для self-contained чтения. Если огромный (с reference/ подкаталогом на 10+ файлов) — только ссылка.

### Правило баланса

«Контекст не засорять референсом на огромный Payload-скрипт» — если pull в payload skill даст 50 KB content в моём контексте, я не справлюсь. Лучше inline на 1 КБ нашей выжимки + reference URL.

**Эвристика:**

- Внешний skill < 5 КБ → референс OK, content загрузится при необходимости
- Внешний skill 5-30 КБ → inline ключевые правила, reference только для глубоких deepdive
- Внешний skill > 30 КБ → строго inline нужные части, reference как «if you need more»

## Структура `SKILL.md`

### Frontmatter

```yaml
---
name: whg-<topic>
description: <одна-две фразы что покрывает + когда триггерить. Concrete и точно. Никаких "помогает с X" — пиши "когда делаешь X / правишь Y / debug Z".>
---
```

`description` важна — AI решает читать ли skill **только по description**. Если плохо описано — skill не активируется когда надо.

**Хороший description:** «Workflow секретов в Holy Grail сайтах — Infisical self-host + UA machine identities. Триггерить при создании нового сайта, ротации секрета, debug «secret not found»...»

**Плохой:** «Помогает работать с Infisical».

### Sections (типичная структура)

1. `## Когда триггерить` — bullet list use cases
2. `## Архитектура / Принципы / Правила` — содержательная часть
3. `## Workflow / Что делать` — пошаговые инструкции
4. `## Грабли / Watch list` — known issues
5. `## Triple path (UI/AI/Shell)` (если применимо) — все три пути для одного workflow
6. `## Связанные` — ссылки на другие skills + docs/whg/
7. (опционально) `## Ссылки` — внешние ресурсы

### Reference/ подкаталог

Если skill содержит >2 KB деталей разных под-тем — выносим в `reference/<topic>.md`. Главный SKILL.md остаётся как table-of-contents + summary.

Примеры из официальных:

- `payload/SKILL.md` (5 KB) + `payload/reference/{FIELDS,COLLECTIONS,HOOKS,ACCESS-CONTROL,...}.md` (10+ файлов по 5-15 КБ каждый)
- `infisical-self-host/SKILL.md` + `infisical-self-host/references/{docker-deployment,environment-variables,kubernetes-deployment,scaling-and-ha}.md`

Используем тот же паттерн для наших `whg-*` если skill разрастается.

## Симметрия skill ↔ docs/whg/

Skill — для агента (компактно, action-oriented). Docs — для человека (полно, narrative).

| Skill                   | Парный doc                                                 |
| ----------------------- | ---------------------------------------------------------- |
| `whg-rules`             | `docs/whg/30-philosophy.md`                                |
| `whg-layouts`           | `docs/whg/32-structure.md` (раздел про Panel/Slot)         |
| `whg-modals`            | (без отдельного doc — skill самостоятельный)               |
| `whg-infisical`         | `docs/whg/45-data-location.md` + `docs/stack/infisical.md` |
| `whg-template-sync`     | `docs/whg/37-scaffolding.md` (раздел Sync)                 |
| `whg-scaffold`          | `docs/whg/37-scaffolding.md` (полностью)                   |
| `whg-payload-jobs`      | `docs/stack/payload.md`                                    |
| `whg-payload-migration` | `docs/stack/payload.md`                                    |

**Правило:** меняешь skill — посмотри парный doc; меняешь doc — посмотри парный skill. Если меняется только одно, добавь TODO в другое.

В footer skill'а ссылка на doc, в footer doc'а — ссылка на skill. Cross-references двусторонние.

## Lifecycle нового skill'а

1. **Триггер** — заметил повторяющийся workflow / архитектурное правило / WHG-специфику которая не описана.
2. **Имя** — `whg-<topic>`, descriptive, не дольше 30 символов.
3. **Зону** — что покрывает? Если overlap с существующим — расширь существующий, не создавай новый.
4. **Reference vs inline?** — оцени размер внешнего skill'а (см. эвристику выше).
5. **Структура** — frontmatter + Когда триггерить + содержательные секции + Связанные.
6. **Парный doc** — добавь в `docs/whg/<num>-<topic>.md` или раздел в существующем.
7. **CLAUDE.md** — добавь строку в таблице skills.
8. **PLAN / memory** — если skill про новое архитектурное решение, добавь в memory feedback.
9. **sync-template.sh** — если skill должен распространяться в инстансы, добавь в whitelist.

## Lifecycle обновления существующего skill'а

1. Перечитай **парный doc** — синхронизируй обе стороны.
2. Если правило поменялось — обнови `description` (это видят AI tools).
3. Скачанные external skills — **не правь inline**, переcкачиваются через `npx skills add ...`.
4. Наши `whg-*` — правь свободно, версионируется git'ом.
5. Если переименовываешь — git mv папки + sed по всем cross-refs в repo.

## Anti-patterns

- ❌ Skill без префикса (`payload-jobs` вместо `whg-payload-jobs`) — конфликтует с возможным официальным
- ❌ Skill с расплывчатым description («помогает с X») — AI не активирует когда надо
- ❌ Skill дублирует внешний 1:1 — лучше референс
- ❌ Skill ссылается на огромный внешний без summary — контекст агента засоряется
- ❌ Skill изменён, docs/whg/ устарел — рассинхрон
- ❌ Скачанный external skill правится inline — потеряется при `npx skills add` overwrite
- ❌ Reference/ подкаталог разрастается > 50 КБ — пора рефакторить, разнести по нескольким skills

## Связанные

- [`docs/whg/30-philosophy.md`](../../../docs/whg/30-philosophy.md) — R-правила
- [`feedback_triple_path_no_ai_lockin`](../../) memory — UI/AI/Shell, AI как один из путей
- [`feedback_detect_instance_offer_readme`](../../) memory — instance vs template detection
