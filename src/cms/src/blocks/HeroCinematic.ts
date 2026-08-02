import type { Block } from 'payload';

/**
 * HeroCinematic — «журнальная» обложка: видео на фоне, виньетка поверх и
 * контент, разложенный по углам экрана.
 *
 * Отличие от обычного `hero`: тот про заголовок и подзаголовок, этот — про
 * атмосферу. Видео приглушается фильтром и замедляется, чтобы не спорить с
 * текстом, а подписи по углам держат рамку кадра как разворот журнала.
 *
 * Уместен там, где есть живое видео места или человека — зал, студия, съёмка.
 * Если видео нет, блок покажет постер: пустого экрана не будет.
 */
export const HeroCinematicBlock: Block = {
  slug: 'hero-cinematic',
  labels: { singular: 'Обложка с видео', plural: 'Обложки с видео' },
  fields: [
    {
      name: 'videoUrl',
      label: 'Ссылка на видео (mp4)',
      type: 'text',
      admin: {
        description:
          'Прямая ссылка на файл. Видео идёт без звука и по кругу — так его разрешают проигрывать браузеры без нажатия. Держите ролик коротким и лёгким: 5-10 секунд и до 5 МБ. Он грузится у каждого посетителя, и тяжёлый файл заметно тормозит первый экран.',
      },
    },
    {
      name: 'poster',
      label: 'Постер (первый кадр)',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Показывается, пока видео грузится, и вместо него на мобильном интернете. Без постера первые секунды экран будет тёмным.',
      },
    },
    {
      name: 'watermark',
      label: 'Знак фоном',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'Логотип крупно и полупрозрачно сбоку кадра. Нужен файл с прозрачным фоном — картинка с заливкой перекроет видео квадратом.',
      },
    },
    {
      name: 'watermarkSide',
      label: 'Сторона знака',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Справа', value: 'right' },
        { label: 'Слева', value: 'left' },
      ],
      admin: { condition: (_, siblingData) => Boolean(siblingData?.['watermark']) },
    },
    {
      name: 'brand',
      label: 'Крупная надпись сверху',
      type: 'text',
      admin: { description: 'Название бренда или проекта. Набирается вразрядку заглавными.' },
    },
    {
      name: 'headline',
      label: 'Главная строка',
      type: 'text',
      admin: { description: 'Что вы предлагаете. Например: «Персональные тренировки».' },
    },
    {
      name: 'highlightLabel',
      label: 'Выделенная строка под главной',
      type: 'text',
      admin: {
        description: 'Имя человека, город, направление — то, что должно броситься в глаза.',
      },
    },
    {
      name: 'highlightHref',
      label: 'Ссылка выделенной строки',
      type: 'text',
      admin: { description: 'Необязательно. Если заполнить, строка станет ссылкой.' },
    },
    {
      name: 'quote',
      label: 'Цитата',
      type: 'textarea',
      admin: { description: 'Короткая фраза в рамке между заголовком и кнопкой.' },
    },
    {
      name: 'ctaLabel',
      label: 'Кнопка — текст',
      type: 'text',
    },
    {
      name: 'ctaHref',
      label: 'Кнопка — ссылка',
      type: 'text',
    },
    {
      name: 'corners',
      label: 'Подписи по углам',
      type: 'array',
      maxRows: 4,
      admin: {
        description:
          'До четырёх коротких подписей в углах кадра. Каждая берёт свой угол; два угла в одном месте перекроют друг друга.',
      },
      fields: [
        {
          name: 'position',
          label: 'Угол',
          type: 'select',
          required: true,
          defaultValue: 'top-left',
          options: [
            { label: 'Сверху слева', value: 'top-left' },
            { label: 'Сверху справа', value: 'top-right' },
            { label: 'Снизу слева', value: 'bottom-left' },
            { label: 'Снизу справа', value: 'bottom-right' },
          ],
        },
        { name: 'title', label: 'Заголовок', type: 'text', required: true },
        { name: 'subtitle', label: 'Пояснение', type: 'text' },
        {
          name: 'emphasis',
          label: 'Размер',
          type: 'select',
          defaultValue: 'medium',
          options: [
            { label: 'Крупный', value: 'large' },
            { label: 'Средний', value: 'medium' },
            { label: 'Мелкий', value: 'small' },
          ],
        },
      ],
    },
  ],
};
