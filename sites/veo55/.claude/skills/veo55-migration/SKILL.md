---
name: veo55-migration
description: Программная миграция контента из легаси Joomla-veo55 в наш Payload. SSH-доступ к VPS, Joomla REST API, VK API для SocialFeed. Скрипты в sites/veo55/src/cms/src/migrate/*.ts, запуск через infisical run. Идемпотентность по slug/externalId. Триггерить когда мигрируешь статьи / медиа / VK-стену / любой контент из старого Joomla.
---

# Skill: veo55-migration

> Миграция через скрипты, не ручной копи-паст. SSH/REST/VK API под рукой — значит делается программно.

## Когда триггерить

- Мигрируешь статьи из старого Joomla `#__content` в Payload `Pages`
- Переносишь `images/` из VPS в Payload `Media`
- Подтягиваешь VK-стену → `SocialFeed.items[]`
- Любой импорт контента из легаси

## Когда НЕ триггерить

- Контент уже в Payload, нужно его поправить
- Новая страница пишется с нуля (нет источника в Joomla)
- Импорт делается из Excel / CSV (это другой workflow)

## Источники и доступ

| Источник            | Доступ                                                                                                                                                                        | Что забираем                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **SSH к VPS**       | Креды → MCP `HolyGrail/reference/veo55-source` + `C:\Users\SawKing\Documents\ClaudeProjects\veo55\memory\credentials.md`. Bash: `ssh user@host`, `scp`, `mysqldump` через ssh | Дамп MySQL (`#__content`, `#__categories`, `#__users`), `images/` целиком, конфиги        |
| **Joomla REST API** | Base URL + токен там же где SSH-креды. `WebFetch` на endpoint'ы                                                                                                               | Статьи (`/api/index.php/v1/content/articles`), категории, теги, меню — JSON удобнее MySQL |
| **VK API**          | App-token там же. `WebFetch('https://api.vk.com/method/wall.get?owner_id=...&access_token=...&v=5.199')`                                                                      | Посты стены + `wall.getComments` для `SocialFeed`                                         |

## Миграционные скрипты

Живут в `sites/veo55/src/cms/src/migrate/*.ts`:

- `migrate:articles` — Joomla `#__content` → Payload `Pages` с блоками `Prose`/`Image`/`Gallery`
- `migrate:media` — `images/` SSH-выгрузка → Payload `Media` (через Local API + `upload`)
- `migrate:vk-feed` — VK wall → `SocialFeed.items[]` (seed в `Pages` или runtime-fetch — решить per-case)

Запуск:

```bash
pnpm --filter veo55-cms migrate:<source>     # под infisical run -- если токены через env
```

## Правила миграции

1. **Идемпотентность.** Скрипт прогоняется дважды — итог одинаковый. Upsert по стабильному ключу (`slug`, `externalId`).
2. **Никакого ручного копи-паста контента из браузера в Payload-админку.** Источник правды потеряется, не воспроизведёшь.
3. **Сначала dry-run на dev БД, потом prod.** Лог количества записей, sample-выборка глазами.
4. **Скрипт фиксируется коммитом** + краткая запись в `docs/migrations/<date>-<source>.md` (что забрали, откуда, сколько записей, какой adapter).
5. **Обобщать блоки.** Если делаешь `SocialFeed` — пиши контракт `PostItem` в `contracts/`, адаптер VK отдельно (`cms/src/adapters/vk.ts`). Не `VkFeedBlock` — это R5++ нарушение (см. `holygrail-rules`).

## Контракт SocialFeed (пример обобщения)

```ts
type PostItem = {
  id: string;
  publishedAt: string;
  author: { name: string; avatarUrl?: string };
  text: string;
  media?: { type: 'image' | 'video'; url: string; alt?: string }[];
  link: string;
  reactions?: { likes?: number; reposts?: number; comments?: number };
  comments?: PostComment[];
};
```

При извлечении `_template`:

- блок `SocialFeed` → `packages/ui/blocks/social-feed/`
- контракт `PostItem` → `packages/contracts/`
- адаптер VK остаётся в `sites/veo55/cms/adapters/vk.ts`
- второй сайт пишет свой `TelegramChannelAdapter` / `InstagramAdapter` с тем же выходом
