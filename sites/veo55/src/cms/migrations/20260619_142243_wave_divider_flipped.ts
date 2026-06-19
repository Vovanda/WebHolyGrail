import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`flipped\` integer DEFAULT false;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`flipped\` integer DEFAULT false;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`flipped\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`flipped\`;`);
}
