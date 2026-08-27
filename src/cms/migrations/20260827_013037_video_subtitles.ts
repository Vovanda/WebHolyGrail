import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`media_subtitles\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`language\` text,
  	\`label\` text,
  	\`file_id\` integer,
  	\`default\` integer DEFAULT false,
  	FOREIGN KEY (\`file_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(
    sql`CREATE INDEX \`media_subtitles_order_idx\` ON \`media_subtitles\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_subtitles_parent_id_idx\` ON \`media_subtitles\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`media_subtitles_file_idx\` ON \`media_subtitles\` (\`file_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`media_subtitles\`;`);
}
