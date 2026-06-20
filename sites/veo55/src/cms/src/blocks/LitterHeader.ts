import type { Block } from 'payload';

/**
 * LitterHeader — заголовок помёта + родители.
 *
 * @remarks
 * Часть декомпозиции монолитного `litter-card` на три атомарных блока:
 *  - `litter-header` — title + dob + ParentsBar (мама/папа с их регалиями)
 *  - `litter-pair-card` — визитка пары (изображение(я) + caption)
 *  - `litter-puppies` — сетка карточек щенков
 *
 * Декомпозиция даёт возможность располагать секции помёта произвольно
 * на странице (между ними произвольные Prose/Quote/AchievementBanner)
 * и фреймить каждую независимо (через `ContentFrame`).
 */
export const LitterHeaderBlock: Block = {
  slug: 'litter-header',
  labels: { singular: 'Помёт · Заголовок и родители', plural: 'Помёт · Заголовки и родители' },
  fields: [
    {
      name: 'litter',
      label: 'Помёт',
      type: 'relationship',
      relationTo: 'litters',
      required: true,
      admin: { description: 'Заголовок, дата и родители подтягиваются из записи.' },
    },
  ],
};
