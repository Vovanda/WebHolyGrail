---
name: whg-git-commit
description: Как AI делает коммиты в Web Holy Grail без засорения истории. Главное — amend в **свой** текущий коммит пока ты в том же bounded context (один логический скоуп: client / cms / contracts / seed / docs / infra / dx / ci). Новый коммит — только когда контекст сменился. Каждый коммит атомарен — `git checkout <sha>` даёт работающий стек. Один файл / одна строка / «fix typo» подряд — антипаттерн, склеивать через fixup+autosquash. Описание короткое — заголовок + до 5 bullets максимум, без полотен. Без `Co-Authored-By`. Без merge-коммитов. Триггерить перед любым commit / amend / fixup / rebase.
---

# Skill: whg-git-commit

> История WHG-инстанса = читаемая по `git log --oneline` через год. Без AI-шума «wip / fix2 / typo» и без 12-bullet полотен.

## Главное правило: amend в свой коммит пока контекст тот же

Работаешь над **той же задачей в том же контексте** — `git commit --amend --no-edit`, не новый коммит.

Новый коммит — только когда:

1. Сменился bounded context (был `client`, стал `cms`)
2. Завершилась логическая единица работы (фича закрыта, начинаешь следующую)
3. Перешёл из реализации в документацию (или наоборот)

Между новым и старым коммитом — задайся вопросом: **«если я откачу один, останется ли другой осмысленным?»** Если нет — это один коммит, amend.

## Bounded contexts WHG (= scope коммита)

| scope       | Что туда                                                  |
| ----------- | --------------------------------------------------------- |
| `client`    | `src/client/` — Next.js фронт                             |
| `cms`       | `src/cms/` — Payload коллекции, блоки, конфиг             |
| `contracts` | `contracts/` — типы между client и cms (R3)               |
| `seed`      | `src/cms/src/seed/*` — стартовый контент                  |
| `infra`     | `deploy/*`, docker, nginx                                 |
| `dx`        | root scripts, `.claude/skills/`, `dev.sh`, `dev-setup.sh` |
| `docs`      | `docs/whg/`, README, doc-журналы                          |
| `ci`        | `.github/workflows/`                                      |

Изменения в одном scope = один коммит (amend всегда в свой). Смешались два scope → разнести через `git commit -- <pathspec>` или `git restore --staged` + поэтапный `git add`.

## Прикидка количества коммитов

**Сначала** посмотри `git diff --stat HEAD`, прикинь сколько разных bounded contexts затронуто. Это и есть верхняя граница коммитов.

| Задача                              | Норма коммитов                          |
| ----------------------------------- | --------------------------------------- |
| Простая (один контекст)             | 1                                       |
| Обычная (2-3 контекста)             | 2-3                                     |
| Большая (несколько слоёв)           | 5                                       |
| Очень большая (затронула почти всё) | 7 (потолок)                             |
| Больше 7                            | Признак что задачу пора разбить на PR'ы |

## Антипаттерны (склеивать сразу)

- ❌ Подряд `fix`, `fix2`, `wip`, `typo`, `update after review × N`
- ❌ Коммит = 1 файл, 1 строка правок (если это не действительно отдельный логический unit)
- ❌ Checkpoint-коммиты «прогресс виден» (visibility даёт `git push`, не история)
- ❌ Merge-коммиты в main (только rebase)
- ❌ `Co-Authored-By: Claude` / `Co-authored-by: AI` (инстанс единственного разработчика — мусор)
- ❌ Имена конкретных людей в commit message (actor-independent template)

## Формат сообщения

```
type(scope): итог одной фразой

- факт результата 1
- факт результата 2
```

**Заголовок:** `type` + `(scope)` + что в итоге получено. **Итог**, не процесс. Не «add», не «implement» — «X работает / X добавлен / X переехал».

**Тело:** только если без него заголовок недопонятен. 2-5 коротких bullets максимум. **Без полотен на 12 пунктов** — это AI-шум.

Types: `feat` / `fix` / `chore` / `refactor` / `docs` / `test` / `ci`.

## Что делать когда забыл amend и наплодил мелочи

Сценарий: за сессию 5 коммитов «added file», «fix typo», «update import», «another fix» — все по 1 файлу. Это **один** коммит по смыслу.

```bash
# 1. Backup на всякий случай
git tag pre-squash-$(date +%Y%m%d-%H%M)

# 2. Найди базу (origin/main / первый коммит ветки)
BASE=$(git merge-base HEAD origin/main)

# 3. Squash в один коммит через скриптованный sequence editor
cat > /tmp/seq.sh <<'EOF'
#!/bin/bash
# Первый = pick, остальные = squash (склеивает с предыдущим)
sed -i '2,$ s/^pick/squash/' "$1"
EOF
chmod +x /tmp/seq.sh

# 4. GIT_EDITOR=true принимает авто-склеенное сообщение
GIT_SEQUENCE_EDITOR=/tmp/seq.sh GIT_EDITOR=true git rebase -i $BASE

# 5. Перепиши итоговое сообщение нормально
git commit --amend
```

## Fixup в существующий коммит ветки (не HEAD)

Когда нужно дописать в коммит C посередине ветки (например, расширил блок из старого `feat(client)`):

```bash
git add <files>
git commit --fixup=<sha-of-C>
GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash $(git merge-base HEAD origin/main)
```

`--autosquash` упорядочит fixup сразу после target и склеит без редактирования.

## Чеклист перед `git commit`

1. `git diff --staged --stat` — staged area сейчас в одном bounded context?
2. Если в нескольких — `git restore --staged` + поэтапный add по группам
3. Это **продолжение** моего текущего коммита (тот же контекст, та же задача)? → `git commit --amend --no-edit`
4. Это **новый контекст / задача**? → `git commit -m "..."` с conventional форматом
5. После коммита: `git log --oneline -5` — не накапливается ли мелочёвка? Если да — squash сразу, не потом

## Подводные камни

- **AI-агент не может в `-i` rebase** — всегда через `GIT_SEQUENCE_EDITOR=<script>` + `GIT_EDITOR=...`
- **Цепляй только соседние коммиты** при squash — пере-упорядочивание ломает применение
- **Сначала backup-tag**: `git tag pre-squash-...` — `git reset --hard <tag>` если что
- **Force-push в main** — только по явной авторизации владельца репо

## Связанные skills

- `whg-rules` — границы scope'ов (R3 client ↔ cms через contracts, R4 модули, R5 чистые функции)
- `whg-skill-authoring` — naming-конвенция `whg-*`
