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
