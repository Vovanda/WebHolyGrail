import type { Block } from 'payload';

/**
 * HeroSplit — двух-колоночный hero с текстом+CTA слева и вертикальной
 * картой ступеней справа.
 *
 * Tip для админа: первый блок страницы (visual anchor). Используй
 * `{accent}` в heading чтобы выделить слово в правой части цветом акцента.
 *
 * Правая колонка — карточка с цепочкой шагов (например growth-path продукта
 * или setup-стадии). Может быть пустой если нужен только текст слева.
 */
export const HeroSplitBlock: Block = {
  slug: 'hero-split',
  labels: { singular: 'Hero split (2-колоночный)', plural: 'Hero split (2-колоночные)' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок (H1)',
      type: 'text',
      required: true,
      defaultValue: 'Начните с сайта. Вырастите во что угодно.',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (1-2 предложения)',
      type: 'textarea',
      defaultValue:
        'Web Holy Grail — self-hosted сайт с CMS и архитектурой, которая не заставит вас начинать заново через год.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaPrimary',
          label: 'Primary CTA',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', defaultValue: 'Использовать шаблон' },
            { name: 'href', type: 'text', defaultValue: '#' },
          ],
        },
        {
          name: 'ctaSecondary',
          label: 'Secondary CTA',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', defaultValue: 'Смотреть демо' },
            { name: 'href', type: 'text', defaultValue: '#' },
          ],
        },
      ],
    },
    {
      name: 'badges',
      label: 'Бейджи под CTA',
      type: 'array',
      admin: { description: 'Короткие тэги с зелёной галочкой (4 шт. оптимально).' },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'rightTitle',
      label: 'Заголовок правой карточки (опционально)',
      type: 'text',
      admin: { description: 'Если пусто — карточка без заголовка, сразу шаги.' },
    },
    {
      name: 'rightSteps',
      label: 'Шаги в правой колонке (vertical chain)',
      type: 'array',
      admin: {
        description:
          'Цепочка шагов с иконкой, названием и описанием. Между шагами рендерится стрелка ↓.',
      },
      fields: [
        { name: 'icon', label: 'Эмодзи или название lucide-иконки', type: 'text' },
        { name: 'label', type: 'text', required: true },
        { name: 'sub', type: 'text' },
      ],
    },
    {
      name: 'rightCaption',
      label: 'Подпись под правой карточкой (italic muted)',
      type: 'text',
    },
  ],
};
