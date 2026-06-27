import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

// @safe-bluegreen — expand-only: ADD COLUMN для heading_accent в hero_split +
// project_types_grid (включая versions / reusable / reusable_v таблицы).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`heading_accent\` text;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`heading_accent\` text;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`heading_accent\` text;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`heading_accent\` text;`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`heading_accent\` text;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`heading_accent\` text;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`heading_accent\` text;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`heading_accent\` text;`,
  );
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`heading_accent\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`heading_accent\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`heading_accent\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`heading_accent\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`heading_accent\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`heading_accent\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`heading_accent\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`heading_accent\`;`,
  );
}
