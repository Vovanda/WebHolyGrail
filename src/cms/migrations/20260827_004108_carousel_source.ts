import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`source_channel\` text;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`source_channel\` text;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`source_channel\` text;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`source_channel\` text;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`source_channel\` text;`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`source_channel\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`source_channel\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`source_channel\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`source_channel\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`source_channel\`;`);
}
