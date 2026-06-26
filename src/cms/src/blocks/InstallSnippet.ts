import type { Block } from 'payload';

/**
 * InstallSnippet — однострочный терминальный блок с copy-кнопкой.
 *
 * Tip для админа: ставь сразу под Hero — пользователь видит «как начать» и
 * копирует команду одним кликом. Категорийная конвенция для dev-tools (Payload,
 * Strapi, Resend, Supabase делают так же).
 */
export const InstallSnippetBlock: Block = {
  slug: 'install-snippet',
  labels: { singular: 'Install snippet (терминальная команда)', plural: 'Install snippets' },
  fields: [
    {
      name: 'command',
      label: 'Команда',
      type: 'text',
      required: true,
      defaultValue: 'gh repo create my-site --template Vovanda/WebHolyGrail',
      admin: { description: 'Одна строка. Будет показана в monospace с copy-кнопкой.' },
    },
    {
      name: 'caption',
      label: 'Подпись под командой',
      type: 'text',
      defaultValue: 'Готовый стартовый репозиторий за минуту. Дальше ./dev.sh и пиши код.',
    },
  ],
};
