// @safe-bluegreen - две новые колонки в настройках сайта, старый цвет их не читает
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing } from '../src/lib/migrations/columns';

/**
 * Фон страницы: картинка под всем содержимым и её пара для тёмной темы.
 *
 * Откат снимает только индексы. Сгенерированный откат пересоздавал таблицу
 * настроек по списку колонок шаблона и унёс бы поля, которые сайт добавил
 * в настройки себе; пустые колонки ссылок на медиа ничему не мешают.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const column of ['page_background_image_id', 'page_background_image_dark_id']) {
    await addColumnIfMissing(db, 'site_settings', column, 'integer REFERENCES media(id)');
  }
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`site_settings_page_background_page_background_image_idx\` ON \`site_settings\` (\`page_background_image_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX IF NOT EXISTS \`site_settings_page_background_page_background_image_dark_idx\` ON \`site_settings\` (\`page_background_image_dark_id\`);`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`DROP INDEX IF EXISTS \`site_settings_page_background_page_background_image_idx\`;`,
  );
  await db.run(
    sql`DROP INDEX IF EXISTS \`site_settings_page_background_page_background_image_dark_idx\`;`,
  );
}
