import type { Block } from 'payload';

/**
 * LitterPairCard — визитка пары родителей.
 *
 * @remarks
 * См. `docs/glossary.md → Визитка пары`. Картинка(и) родителей с
 * подписью регалий. Если у помёта `pairCard.images` пустой — блок
 * не рендерит ничего.
 *
 * Часть декомпозиции `litter-card` (см. {@link LitterHeader}).
 */
export const LitterPairCardBlock: Block = {
  slug: 'litter-pair-card',
  labels: { singular: 'Помёт · Визитка пары', plural: 'Помёт · Визитки пары' },
  fields: [
    {
      name: 'litter',
      label: 'Помёт',
      type: 'relationship',
      relationTo: 'litters',
      required: true,
      admin: { description: 'Визитка берётся из самой записи помёта.' },
    },
  ],
};
