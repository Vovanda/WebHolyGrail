import type { Payload } from 'payload';

/**
 * Переключатели, с которыми сайт начинает жизнь.
 *
 * @remarks
 * Признак заводится один раз и дальше живёт в админке, поэтому в стартовый
 * набор попадает только то, что есть у каждого сайта: выбор слоя управления
 * плеером. Остальное владелец добавляет по мере надобности.
 *
 * Значения включены во всех окружениях: новый сайт должен вести себя привычно,
 * а не наполовину.
 *
 * Повторный запуск ничего не меняет: признак с таким ключом уже есть - идём
 * дальше, чтобы правки владельца не затирались.
 */
const STARTER = [
  {
    title: 'Слой плеера от библиотеки',
    key: 'video.layout.vendor',
    group: 'Видео',
    description: 'Управление кадром рисует библиотека. Выключено - слой, собранный в проекте.',
  },
] as const;

export async function createStarterToggles(payload: Payload): Promise<number> {
  let added = 0;

  for (const item of STARTER) {
    const found = await payload.find({
      collection: 'feature-toggles',
      where: { key: { equals: item.key } },
      limit: 1,
      overrideAccess: true,
    });
    if (found.docs.length > 0) continue;

    await payload.create({
      collection: 'feature-toggles',
      data: { ...item, production: true, staging: true, development: true },
      overrideAccess: true,
    });
    added += 1;
  }

  return added;
}
