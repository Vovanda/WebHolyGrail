import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`list_view\` text DEFAULT 'column';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`show_view_switch\` integer DEFAULT false;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`list_view\` text DEFAULT 'column';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`show_view_switch\` integer DEFAULT false;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`list_view\` text DEFAULT 'column';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`show_view_switch\` integer DEFAULT false;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`list_view\` text DEFAULT 'column';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`show_view_switch\` integer DEFAULT false;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`list_view\` text DEFAULT 'column';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`show_view_switch\` integer DEFAULT false;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`list_view\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`show_view_switch\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`list_view\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`show_view_switch\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`list_view\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`show_view_switch\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`list_view\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`show_view_switch\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`list_view\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`show_view_switch\`;`);
}
