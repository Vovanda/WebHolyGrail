/**
 * seed-puppies-page-certified-notice — добавляет `certified-notice` блок
 * во все Pages со slug-prefix `puppies/` (детальные страницы помётов).
 *
 * Вставляет блок между `litter-pair-card` и `litter-puppies`. Если есть
 * только `litter-header` — после него.
 *
 * Идемпотентен: обновляет existing блок если он уже есть.
 *
 * Запуск: pnpm --filter veo55-cms seed:puppies-page-certified-notice
 */
import { config as dotenvConfig } from 'dotenv';
dotenvConfig({ path: '.env.local' });
dotenvConfig({ path: '.env' });

const { getPayload } = await import('payload');
const config = (await import('../payload.config')).default;

const certifiedNoticeBlock = {
  blockType: 'certified-notice' as const,
  kicker: 'ОТБОРНОЕ РАЗВЕДЕНИЕ · Selected Breeding',
  title: 'Высший статус РКФ',
  body:
    'Оба родителя — **Гранд Чемпионы России**, прошли тесты на наследственные заболевания, ' +
    'чистая дисплазия **HD-A / ED-0**, пожизненный допуск в разведение. ' +
    'Помёт подтверждён по Приложению №7 РКФ.',
  criteriaTitle: 'Требования Приложения №7 РКФ — все соблюдены',
  criteria: [
    { text: 'ДНК-профиль (паспорт)' },
    { text: 'Титул «Гранд Чемпион России»' },
    { text: 'Племенной смотр РР' },
    { text: 'Рабочий сертификат ОКД + ЗКС' },
    { text: 'Дисплазия HD-A · ED-0' },
  ],
};

async function main() {
  console.log('[seed:puppies-page-certified-notice] starting…');
  const payload = await getPayload({ config });

  const pages = await payload.find({
    collection: 'pages',
    where: { slug: { like: 'puppies/' } },
    limit: 100,
    depth: 0,
  });

  if (pages.docs.length === 0) {
    console.log('[seed:puppies-page-certified-notice] нет страниц с префиксом puppies/');
    process.exit(0);
  }

  for (const page of pages.docs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blocks = (page.blocks ?? []) as any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = blocks.findIndex((b: any) => b.blockType === 'certified-notice');
    if (existing >= 0) {
      blocks[existing] = { ...blocks[existing], ...certifiedNoticeBlock };
      console.log(
        `[seed:puppies-page-certified-notice] page id=${page.id} slug=${page.slug} — обновил existing.`,
      );
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pairIdx = blocks.findIndex((b: any) => b.blockType === 'litter-pair-card');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const headerIdx = blocks.findIndex((b: any) => b.blockType === 'litter-header');
      const insertAfter = pairIdx >= 0 ? pairIdx : headerIdx;
      if (insertAfter < 0) {
        console.warn(
          `[seed:puppies-page-certified-notice] page id=${page.id} slug=${page.slug} — нет litter-header/pair-card, пропускаю.`,
        );
        continue;
      }
      blocks.splice(insertAfter + 1, 0, certifiedNoticeBlock);
      console.log(
        `[seed:puppies-page-certified-notice] page id=${page.id} slug=${page.slug} — вставил после ${insertAfter}.`,
      );
    }

    await payload.update({
      collection: 'pages',
      id: page.id,
      data: { blocks, _status: 'published' } as never,
      draft: false,
    });
  }

  console.log('[seed:puppies-page-certified-notice] OK.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:puppies-page-certified-notice] FAILED:', err);
  process.exit(1);
});
