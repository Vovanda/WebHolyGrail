/**
 * seed-home-certified-notice — вставляет `certified-notice` блок
 * («Отборное разведение РКФ») в home page между `litter-pair-card` и
 * `litter-puppies`. Если pair-card нет — после header.
 *
 * Тексты блока — Приложение №7 РКФ, типовые для всех помётов veo55.
 * R0: контент в БД, не в коде; но первичное наполнение из seed — это
 * способ доставки начальных данных, заводчик потом правит в админке.
 *
 * Идемпотентен: если блок уже есть в home — обновляет тексты.
 *
 * Запуск: pnpm --filter veo55-cms seed:home-certified-notice
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
  console.log('[seed:home-certified-notice] starting…');
  const payload = await getPayload({ config });

  const homeResult = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
  });
  const home = homeResult.docs[0];
  if (!home) {
    console.error('[seed:home-certified-notice] home page не найдена');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blocks = (home.blocks ?? []) as any[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = blocks.findIndex((b: any) => b.blockType === 'certified-notice');
  if (existing >= 0) {
    blocks[existing] = { ...blocks[existing], ...certifiedNoticeBlock };
    console.log('[seed:home-certified-notice] обновил existing certified-notice блок.');
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pairIdx = blocks.findIndex((b: any) => b.blockType === 'litter-pair-card');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const headerIdx = blocks.findIndex((b: any) => b.blockType === 'litter-header');
    const insertAfter = pairIdx >= 0 ? pairIdx : headerIdx;
    if (insertAfter < 0) {
      console.error(
        '[seed:home-certified-notice] не нашёл точку вставки (нет litter-header / litter-pair-card)',
      );
      process.exit(1);
    }
    blocks.splice(insertAfter + 1, 0, certifiedNoticeBlock);
    console.log(`[seed:home-certified-notice] вставил после индекса ${insertAfter}.`);
  }

  await payload.update({
    collection: 'pages',
    id: home.id,
    data: { blocks, _status: 'published' } as never,
    draft: false,
  });

  console.log('[seed:home-certified-notice] OK.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed:home-certified-notice] FAILED:', err);
  process.exit(1);
});
