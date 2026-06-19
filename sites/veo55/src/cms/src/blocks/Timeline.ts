import type { Block } from 'payload';

/**
 * Timeline — записи с годами / эмодзи / текстом.
 * История компании, roadmap, этапы услуги, версии релизов.
 */
export const TimelineBlock: Block = {
  slug: 'timeline',
  labels: { singular: 'Таймлайн', plural: 'Таймлайны' },
  fields: [
    { name: 'heading', label: 'Заголовок секции', type: 'text', defaultValue: 'Наш путь' },
    {
      name: 'visibleCount',
      label: 'Сколько записей показывать сразу',
      type: 'number',
      defaultValue: 3,
      admin: {
        description:
          'Остальные доступны по кнопке «Показать всю историю». 0 = показать все сразу без кнопки.',
      },
    },
    {
      name: 'sort',
      label: 'Порядок записей',
      type: 'select',
      defaultValue: 'year-desc',
      options: [
        { label: 'По году ↓ (новые сверху) — для истории', value: 'year-desc' },
        { label: 'По году ↑ (старые сверху) — для roadmap', value: 'year-asc' },
        { label: 'Ручной порядок (как в админке)', value: 'manual' },
      ],
      admin: {
        description:
          'При year-desc / year-asc автоматически сортирует — при добавлении новой записи её не нужно перетаскивать.',
      },
    },
    {
      name: 'entries',
      label: 'Записи (drag для смены порядка)',
      type: 'array',
      labels: { singular: 'Запись', plural: 'Записи' },
      required: true,
      fields: [
        { name: 'year', label: 'Год / период', type: 'text', required: true },
        {
          name: 'icon',
          label: 'Эмодзи (опционально)',
          type: 'text',
          admin: { description: 'Один эмодзи, напр. 🐾 🏆 📜' },
        },
        { name: 'body', label: 'Текст записи', type: 'textarea', required: true },
        {
          name: 'hidden',
          label: 'Скрыть из основного списка (под «Показать всё»)',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'variant',
      label: 'Вариант дизайна',
      type: 'select',
      defaultValue: 'editorial-dots',
      options: [
        { label: 'Редакционный с точками (veo55-стиль)', value: 'editorial-dots' },
        { label: 'Современный stepper', value: 'modern-stepped' },
        { label: 'Компактный список', value: 'compact' },
      ],
    },
  ],
};
