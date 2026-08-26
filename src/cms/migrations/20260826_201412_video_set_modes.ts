// @safe-bluegreen — только новые колонки блока.
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`mode\` text DEFAULT 'player';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`show_cover\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`mode\` text DEFAULT 'player';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`show_cover\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`mode\` text DEFAULT 'player';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`show_cover\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`mode\` text DEFAULT 'player';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`show_cover\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`show_description\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`mode\` text DEFAULT 'player';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`show_cover\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`show_title\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`show_description\` integer DEFAULT true;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`mode\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`show_cover\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`mode\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`show_cover\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`show_description\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`mode\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`show_cover\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`show_title\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`show_description\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`mode\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`show_cover\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`show_title\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`show_description\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`mode\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`show_cover\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`show_title\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`show_description\`;`);
}
