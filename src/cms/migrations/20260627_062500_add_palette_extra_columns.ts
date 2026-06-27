import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen — expand-only: 6 новых nullable columns для расширенной
// палитры (primary_hover, foreground_muted, surface для light + dark).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_light_primary_hover\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_light_foreground_muted\` text;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_light_surface\` text;`);
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_dark_primary_hover\` text;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_dark_foreground_muted\` text;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` ADD \`theme_palette_dark_surface\` text;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_light_primary_hover\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_light_foreground_muted\`;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_light_surface\`;`);
  await db.run(
    sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_dark_primary_hover\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_dark_foreground_muted\`;`,
  );
  await db.run(sql`ALTER TABLE \`site_settings\` DROP COLUMN \`theme_palette_dark_surface\`;`);
}
