import type { Block } from 'payload';

/**
 * Pedigree — секция «Родословная» для конкретной собаки.
 *
 * @remarks
 * R5+/R5++. Параметризован одной собакой (`dog: relation → dogs`). Сам блок
 * не хранит данные предков — они лежат в `Dogs.pedigree[]` (см. контракт
 * `PedigreeAncestor`). Сидер `seed:fetch-pedigree` подкачивает их из РКФ.
 *
 * Блок ставится в Pages через админку — на странице собаки, помёта,
 * сравнении линий, в архивной справке и т.п.
 */
export const PedigreeBlock: Block = {
  slug: 'pedigree',
  labels: { singular: 'Родословная', plural: 'Родословные' },
  fields: [
    {
      name: 'dog',
      label: 'Собака',
      type: 'relationship',
      relationTo: 'dogs',
      required: true,
    },
    {
      name: 'title',
      label: 'Заголовок секции',
      type: 'text',
      admin: { description: 'Если пусто — рендерится «Родословная».' },
    },
  ],
};
