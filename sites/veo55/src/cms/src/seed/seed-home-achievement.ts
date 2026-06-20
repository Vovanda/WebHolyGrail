/**
 * seed-home-achievement — добавляет блок AchievementBanner на главную страницу
 * (pages[slug='home'].blocks) сразу после litter-card.
 *
 * Контент — РКФ «Отборное разведение / Selected Breeding» 1:1 с прода
 * (https://veo55.ru/, секция #puppies_1, inline .veo-rkf-badge + .veo-rkf-reqs).
 *
 * Запуск: pnpm --filter veo55-cms seed:home-achievement
 * Идемпотентен: если блок с таким `slug`+`title` уже есть — пропускает.
 *
 * Архитектура: Payload Local API (как будет дёргать AI-агент через Telegram,
 * см. memory `project_olga_via_telegram_ai_agent.md`).
 */
// .env.local подгружаем до любого импорта Payload (payload.config читает
// process.env при загрузке модуля).
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { getPayload } = await import('payload');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = (await import('../payload.config')).default;

const ACHIEVEMENT_TITLE = 'Отборное разведение';

async function main() {
  console.log('[seed:home-achievement] starting…');
  const payload = await getPayload({ config });

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  if (!home) {
    console.error('[seed:home-achievement] home page не найдена в Pages');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (home.blocks ?? []) as any[];
  const already = blocks.some(
    (b) => b.blockType === 'achievement-banner' && b.title === ACHIEVEMENT_TITLE,
  );
  if (already) {
    console.log('[seed:home-achievement] AchievementBanner уже на главной — пропускаю.');
    process.exit(0);
  }

  // Lexical AST для description: 2 параграфа с inline bold.
  const descriptionLexical = buildDescription();

  const newBlock = {
    blockType: 'achievement-banner',
    icon: '🏆',
    title: 'Отборное разведение',
    titleSuffix: '· Selected Breeding',
    description: descriptionLexical,
    items: [
      { text: 'ДНК-профиль (паспорт)' },
      { text: 'Титул «Гранд Чемпион России»' },
      { text: 'Племенной смотр РР' },
      { text: 'Рабочий сертификат ОКД + ЗКС' },
      { text: 'Дисплазия HD-A · ED-0' },
    ],
    accent: 'amber',
  };

  // Вставляем сразу после litter-card. Если litter-card нет — в конец.
  const litterIdx = blocks.findIndex((b) => b.blockType === 'litter-card');
  const insertAt = litterIdx >= 0 ? litterIdx + 1 : blocks.length;
  const newBlocks = [...blocks.slice(0, insertAt), newBlock, ...blocks.slice(insertAt)];

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { blocks: newBlocks, _status: 'published' } as never,
    // Без этого update создаёт новый draft, и `_status` страницы откатывается
    // → main вернёт 404 для публичных запросов с `where[_status]=published`.
    draft: false,
  });

  console.log(
    `[seed:home-achievement] OK. AchievementBanner вставлен на позицию [${insertAt}] (после litter-card).`,
  );
  process.exit(0);
}

/**
 * Lexical AST для description AchievementBanner.
 *
 * Структура — корневой root → paragraph → text nodes.
 * `format` — битовая маска (bit 0 = bold).
 */
function buildDescription() {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            { type: 'text', version: 1, format: 0, text: 'Высший статус РКФ — оба родителя ' },
            { type: 'text', version: 1, format: 1, text: 'Гранд Чемпионы России' },
            {
              type: 'text',
              version: 1,
              format: 0,
              text: ', прошли тесты на наследственные заболевания, чистая дисплазия ',
            },
            { type: 'text', version: 1, format: 1, text: 'HD-A / ED-0' },
            { type: 'text', version: 1, format: 0, text: ', пожизненный допуск в разведение.' },
          ],
        },
        {
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: [
            {
              type: 'text',
              version: 1,
              format: 0,
              text: 'Помёт подтверждён по Приложению №7 РКФ.',
            },
          ],
        },
      ],
    },
  };
}

main().catch((err) => {
  console.error('[seed:home-achievement] FAILED:', err);
  process.exit(1);
});
