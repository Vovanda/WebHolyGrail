import type { Block } from 'payload';

/**
 * CtaBanner — финальный CTA-блок перед footer.
 *
 * Tip для админа: один яркий блок, синий фон, белый текст. 2 CTA-кнопки.
 * Один из самых конвертирующих паттернов в категории — все 7/7 lendings'ов
 * категории заканчивают похожим блоком.
 */
export const CtaBannerBlock: Block = {
  slug: 'cta-banner',
  labels: { singular: 'CTA banner', plural: 'CTA banners' },
  fields: [
    {
      name: 'heading',
      label: 'Заголовок (короткий)',
      type: 'text',
      required: true,
      defaultValue: 'Готовы начать?',
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок (1-2 предложения)',
      type: 'textarea',
      defaultValue:
        'Клонируйте шаблон, разворачивайте локально через ./dev-setup.sh && ./dev.sh — и пишите код.',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ctaPrimary',
          label: 'Primary CTA (белая кнопка)',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', required: true, defaultValue: 'Использовать шаблон' },
            { name: 'href', type: 'text', required: true, defaultValue: '#' },
          ],
        },
        {
          name: 'ctaSecondary',
          label: 'Secondary CTA (transparent outline)',
          type: 'group',
          fields: [
            { name: 'label', type: 'text', defaultValue: 'Документация' },
            { name: 'href', type: 'text', defaultValue: '#' },
          ],
        },
      ],
    },
  ],
};
