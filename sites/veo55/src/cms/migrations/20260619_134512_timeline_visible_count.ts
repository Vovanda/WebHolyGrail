import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`visible_count\` numeric DEFAULT 3;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`visible_count\` numeric DEFAULT 3;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`visible_count\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`visible_count\`;`);
}
