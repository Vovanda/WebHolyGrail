import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`variant\` text DEFAULT 'wave';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`variant\` text DEFAULT 'wave';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`variant\` text DEFAULT 'wave';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`variant\` text DEFAULT 'wave';`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`variant\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`variant\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`variant\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`variant\`;`,
  );
}
