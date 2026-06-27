import type { Payload } from 'payload';
import { FAQ_GROUPS, type FaqGroupSeed } from './groups.js';

/**
 * Создаёт/обновляет FAQ-группы по slug. Идемпотентно.
 *
 * SEED_FORCE_FAQ=1 — перезаписать существующие группы (поля + items).
 * Без флага: существующие группы не трогаются (downstream-кастомизация
 * не затирается).
 */
export async function createFaqGroups(
  payload: Payload,
): Promise<{ created: number; updated: number; skipped: number; ids: number[] }> {
  const force = process.env['SEED_FORCE_FAQ'] === '1';
  let created = 0;
  let updated = 0;
  let skipped = 0;
  const ids: number[] = [];

  for (const group of FAQ_GROUPS) {
    const result = await upsertGroup(payload, group, force);
    ids.push(result.id);
    if (result.action === 'created') created++;
    else if (result.action === 'updated') updated++;
    else skipped++;
  }

  return { created, updated, skipped, ids };
}

async function upsertGroup(
  payload: Payload,
  group: FaqGroupSeed,
  force: boolean,
): Promise<{ id: number; action: 'created' | 'updated' | 'skipped' }> {
  const existing = await payload.find({
    collection: 'faq-groups',
    where: { slug: { equals: group.slug } },
    limit: 1,
    overrideAccess: true,
  });

  const data = {
    order: group.order,
    emoji: group.emoji,
    title: group.title,
    slug: group.slug,
    items: group.items.map((item) => ({
      question: item.question,
      answer: item.answer,
      openByDefault: Boolean(item.openByDefault),
    })),
    _status: 'published' as const,
  };

  if (existing.docs.length > 0) {
    const existingDoc = existing.docs[0]!;
    if (!force) {
      return { id: existingDoc.id as number, action: 'skipped' };
    }
    const result = await payload.update({
      collection: 'faq-groups',
      id: existingDoc.id,
      data,
      overrideAccess: true,
    });
    return { id: result.id as number, action: 'updated' };
  }

  const result = await payload.create({
    collection: 'faq-groups',
    data,
    overrideAccess: true,
  });
  return { id: result.id as number, action: 'created' };
}
