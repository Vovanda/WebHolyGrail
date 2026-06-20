import type { Block, Field } from 'payload';

/**
 * Поля видимости блока — добавляются ко **всем** PAGE_BLOCKS через `withVisibility`.
 *
 * @remarks
 * Чекбоксы «показывать на ПК / планшете / мобиле» — позволяют скрыть блок
 * на конкретном устройстве (например лёгкая версия мобильной главной без
 * тяжёлого слайдера). Рендеринг на клиенте — через CSS-классы:
 * `hidden md:max-lg:hidden lg:block` и т.п. — SSR-совместимо.
 *
 * Breakpoints (Tailwind default):
 *  - mobile:  < 768px
 *  - tablet:  768–1023px (md → lg-1)
 *  - desktop: ≥ 1024px (lg+)
 *
 * Дефолт — всё включено (видно везде), чтобы существующие записи не сломались.
 */
export const VISIBILITY_FIELDS: Field[] = [
  {
    name: 'visibility',
    type: 'group',
    label: 'Видимость',
    admin: { description: 'Где показывать блок.' },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'desktop',
            label: 'ПК (≥ 1024px)',
            type: 'checkbox',
            defaultValue: true,
            admin: { width: '33%' },
          },
          {
            name: 'tablet',
            label: 'Планшет (768–1023px)',
            type: 'checkbox',
            defaultValue: true,
            admin: { width: '33%' },
          },
          {
            name: 'mobile',
            label: 'Мобила (< 768px)',
            type: 'checkbox',
            defaultValue: true,
            admin: { width: '33%' },
          },
        ],
      },
    ],
  },
];

/** Помощник: вернёт копию блока с добавленными visibility-полями в конец. */
export function withVisibility(block: Block): Block {
  return {
    ...block,
    fields: [...block.fields, ...VISIBILITY_FIELDS],
  };
}
