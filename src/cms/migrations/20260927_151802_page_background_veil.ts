// @safe-bluegreen - две новые колонки в настройках сайта, старый цвет их не читает
import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

import { addColumnIfMissing, hasColumn } from '../src/lib/migrations/columns';

/** Вуаль цвета темы над фоном страницы: в светлой и в тёмной теме, в процентах. */
const COLUMNS = ['page_background_veil', 'page_background_veil_dark'];

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const column of COLUMNS) await addColumnIfMissing(db, 'site_settings', column, 'numeric');
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const column of COLUMNS) {
    if (await hasColumn(db, 'site_settings', column)) {
      await db.run(sql.raw(`ALTER TABLE \`site_settings\` DROP COLUMN \`${column}\`;`));
    }
  }
}
