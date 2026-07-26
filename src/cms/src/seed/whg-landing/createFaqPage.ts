import type { Payload } from 'payload';

/**
 * Создаёт/обновляет страницу /faq с блоком faq-accordion.
 *
 * Идемпотентно: если страница уже есть с непустыми blocks — не трогаем.
 * SEED_FORCE_FAQ_PAGE=1 — перезаписать блоки.
 */
export async function createFaqPage(
  payload: Payload,
  faqGroupIds: number[],
): Promise<{ created: boolean; id: number }> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'faq' } },
    limit: 1,
    overrideAccess: true,
  });

  const data = buildPageData(faqGroupIds);
  const force = process.env['SEED_FORCE_FAQ_PAGE'] === '1';

  if (existing.docs.length > 0) {
    const existingPage = existing.docs[0]!;
    const hasContent =
      Array.isArray(existingPage.blocks) && (existingPage.blocks as unknown[]).length > 0;
    if (hasContent && !force) {
      return { created: false, id: existingPage.id as number };
    }
    const updated = await payload.update({
      collection: 'pages',
      id: existingPage.id,
      data,
      overrideAccess: true,
    });
    return { created: true, id: updated.id as number };
  }

  const page = await payload.create({
    collection: 'pages',
    data,
    overrideAccess: true,
  });
  return { created: true, id: page.id as number };
}

function buildPageData(faqGroupIds: number[]) {
  return {
    title: 'Ответы на вопросы',
    slug: 'faq',
    _status: 'published' as const,
    seo: {
      title: 'FAQ — Web Holy Grail',
      description:
        'Частые сомнения и честные ответы про Web Holy Grail — для бизнеса и разработчиков.',
    },
    blocks: [
      {
        blockType: 'faq-accordion' as const,
        title: 'Ответы на вопросы',
        titleEmoji: '💬',
        lead: 'Частые сомнения и честные ответы — для тех, кто выбирает фундамент сайта.',
        showChips: true,
        groups: faqGroupIds,
      },
    ],
  };
}
