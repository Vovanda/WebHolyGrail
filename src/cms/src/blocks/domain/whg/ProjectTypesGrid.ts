import type { Block } from 'payload';

/**
 * ProjectTypesGrid — 2×2 (или другая сетка) карточек типов проектов WHG.
 *
 * Tip для админа: показывает «с чего начать» — Minimal / Business Card / Blog / Portal
 * (project types из docs/whg/37-scaffolding.md). Это WHG-специфичный блок —
 * для downstream-сайтов не используется (у них одна ниша, не несколько стартовых типов).
 */
export const ProjectTypesGridBlock: Block = {
  slug: 'project-types-grid',
  labels: { singular: 'Сетка типов проектов (WHG)', plural: 'Сетки типов проектов' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'heading',
          label: 'Заголовок секции',
          type: 'text',
          defaultValue: 'Одна архитектура. Несколько сценариев роста.',
          admin: { width: '60%' },
        },
        {
          name: 'headingAccent',
          label: 'Слова для акцента (case-sensitive)',
          type: 'text',
          admin: {
            width: '40%',
            description: 'Подстрока из heading которая будет подсвечена акцентным цветом.',
          },
        },
      ],
    },
    {
      name: 'subtitle',
      label: 'Подзаголовок',
      type: 'textarea',
      defaultValue:
        'Выберите стартовую точку под ваш проект. Архитектура остаётся той же — меняется только стартовая конфигурация.',
    },
    {
      name: 'items',
      label: 'Типы проектов',
      type: 'array',
      minRows: 2,
      maxRows: 8,
      fields: [
        {
          name: 'icon',
          label: 'Эмодзи или название иконки',
          type: 'text',
          required: true,
        },
        { name: 'label', label: 'Название типа', type: 'text', required: true },
        { name: 'description', label: 'Что внутри', type: 'text' },
        {
          name: 'status',
          label: 'Статус',
          type: 'select',
          defaultValue: 'available',
          options: [
            { label: 'Доступен', value: 'available' },
            { label: 'В разработке', value: 'roadmap' },
          ],
        },
      ],
    },
    {
      name: 'caption',
      label: 'Подпись под сеткой (italic muted)',
      type: 'text',
      defaultValue:
        'Тип проекта — это старт, не ограничение. Добавляйте возможности по мере роста.',
    },
  ],
};
