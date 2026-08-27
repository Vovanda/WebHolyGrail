import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`media_chapters\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` integer NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`start_seconds\` numeric,
  	\`title\` text,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `);
  await db.run(sql`CREATE INDEX \`media_chapters_order_idx\` ON \`media_chapters\` (\`_order\`);`);
  await db.run(
    sql`CREATE INDEX \`media_chapters_parent_id_idx\` ON \`media_chapters\` (\`_parent_id\`);`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`media_chapters\`;`);
}
