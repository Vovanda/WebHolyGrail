import type { Block } from 'payload';

/**
 * LitterPuppies — сетка карточек щенков помёта.
 *
 * @remarks
 * Часть декомпозиции `litter-card` (см. {@link LitterHeader}).
 * Раскладка сетки определяется количеством видимых щенков
 * (см. `puppyGridClass` в `client/blocks/content/LitterPuppies.tsx`).
 */
export const LitterPuppiesBlock: Block = {
  slug: 'litter-puppies',
  labels: { singular: 'Помёт · Щенки', plural: 'Помёт · Сетки щенков' },
  fields: [
    {
      name: 'litter',
      label: 'Помёт',
      type: 'relationship',
      relationTo: 'litters',
      required: true,
      admin: { description: 'Щенки подтягиваются из записи помёта.' },
    },
    {
      name: 'showSold',
      label: 'Показывать проданных щенков',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'По умолчанию скрыты. Включить для архива.' },
    },
  ],
};
