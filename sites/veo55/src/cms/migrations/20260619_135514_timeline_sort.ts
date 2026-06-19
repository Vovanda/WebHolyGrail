import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`sort\` text DEFAULT 'year-desc';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`sort\` text DEFAULT 'year-desc';`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`sort\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`sort\`;`);
}
