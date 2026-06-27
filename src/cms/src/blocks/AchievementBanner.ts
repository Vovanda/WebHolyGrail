import type { Block } from 'payload';

/**
 * AchievementBanner — generic плашка достижения/сертификации/награды.
 *
 * @remarks
 * **R5++ функциональное имя** — переиспользуется для разных доменов:
 *  - Питомник: «РКФ Отборное Разведение» (5 требований Приложения №7)
 *  - Автосервис: «ISO 9001 сертификация» с чек-листом
 *  - Кофейня: «Победитель Coffee Awards 2025» с критериями
 *  - Клиника: лицензии + аккредитации
 *
 * **Структурированно (R0).** Поля типизированные — конструктор Уровня 3
 * увидит схему и построит UI. RichText в `description` ограничен
 * markdown-light (только bold/italic/переносы) — без XSS-риска от HTML,
 * без сложности полного RichText.
 *
 * **accent** определяет семантический цвет плашки (amber для премиум,
 * success для проверено-сертифицировано, info для нейтрального).
 * Точные оттенки идут через CSS-токены `--color-<accent>` (R2).
 */
export const AchievementBannerBlock: Block = {
  slug: 'achievement-banner',
  labels: { singular: 'Плашка достижения', plural: 'Плашки достижений' },
  fields: [
    {
      name: 'icon',
      label: 'Иконка (эмодзи)',
      type: 'text',
      required: true,
      defaultValue: '🏆',
      admin: {
        description:
          'Один эмодзи. Например: 🏆 (награда), 📜 (сертификат), ⭐ (звезда), 🥇 (золото), ✅ (проверено).',
      },
    },
    {
      name: 'title',
      label: 'Заголовок',
      type: 'text',
      required: true,
      admin: {
        description: 'Главная строка плашки. Например: «ОТБОРНОЕ РАЗВЕДЕНИЕ» или «ISO 9001».',
      },
    },
    {
      name: 'titleSuffix',
      label: 'Подзаголовок (курсивом рядом)',
      type: 'text',
      admin: {
        description:
          'Опциональный курсивный suffix после основного заголовка. Например: «· Selected Breeding» или «· сертификат №12345».',
      },
    },
    {
      name: 'description',
      label: 'Описание',
      type: 'richText',
      admin: {
        description:
          'Жирный, курсив, переносы строк — через панель форматирования. Заголовков и списков избегай — для них есть отдельные блоки.',
      },
    },
    {
      name: 'items',
      label: 'Чек-лист пунктов',
      type: 'array',
      labels: { singular: 'Пункт', plural: 'Пункты' },
      admin: {
        description:
          'Каждый пункт показывается отдельной «чек-чипсой» с галочкой. Опционально — оставь пустым если плашке не нужен список.',
      },
      fields: [{ name: 'text', label: 'Текст пункта', type: 'text', required: true }],
    },
    {
      name: 'accent',
      label: 'Цвет акцента',
      type: 'select',
      defaultValue: 'amber',
      options: [
        { label: 'Янтарь (премиум, награды РКФ)', value: 'amber' },
        { label: 'Зелёный успех (сертификация, проверено)', value: 'success' },
        { label: 'Синий (информация, факт)', value: 'info' },
        { label: 'Красный (внимание, эксклюзив)', value: 'danger' },
        { label: 'Нейтральный (шоколадно-кремовый)', value: 'neutral' },
      ],
      admin: {
        description: 'Определяет цвет фона/бордера/чек-чипсов плашки. Под бренд-палитру сайта.',
      },
    },
  ],
};
