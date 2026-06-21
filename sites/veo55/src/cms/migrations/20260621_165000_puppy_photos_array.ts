import { type MigrateDownArgs, type MigrateUpArgs, sql } from '@payloadcms/db-sqlite';

/**
 * `Puppy.photo` (single MediaRef) → `Puppy.photos[]` (array of MediaRef).
 *
 * Зачем: legacy веб обычно даёт по 3 фото на щенка (см. `images/14-04-26/
 * zonarnaya-devochka-01..03.jpg`). Single-photo поле не позволяло их вынести
 * в карточку — карусель в `PuppyCard` тоже не было смысла строить.
 *
 * Структура:
 *  - новая `litters_puppies_photos` (live) + `_litters_v_version_puppies_photos`
 *    (versions). Каждая запись — один MediaRef с `_order` для порядка.
 *  - data migration: для каждого `litters_puppies.photo_id` создаём запись
 *    `litters_puppies_photos` (_order=0, image_id=photo_id, id=hex(randomblob)).
 *    Аналогично для versions.
 *  - `litters_puppies.photo_id` колонка дропается (вместе с FK и индексом).
 *
 * SQLite ALTER DROP COLUMN c FK работает на 3.45+, libsql 0.4.7 OK.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // ── live table ──────────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`litters_puppies_photos\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` text NOT NULL,
      \`id\` text PRIMARY KEY NOT NULL,
      \`image_id\` integer NOT NULL,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`litters_puppies\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `);
  await db.run(
    sql`CREATE INDEX \`litters_puppies_photos_order_idx\` ON \`litters_puppies_photos\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_puppies_photos_parent_id_idx\` ON \`litters_puppies_photos\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`litters_puppies_photos_image_idx\` ON \`litters_puppies_photos\` (\`image_id\`);`,
  );

  // Перенос данных live: один photo → photos[0].
  await db.run(sql`
    INSERT INTO \`litters_puppies_photos\` (\`_order\`, \`_parent_id\`, \`id\`, \`image_id\`)
    SELECT 0, id, lower(hex(randomblob(12))), photo_id
    FROM \`litters_puppies\`
    WHERE photo_id IS NOT NULL;
  `);

  // ── versions table ─────────────────────────────────────────
  await db.run(sql`
    CREATE TABLE \`_litters_v_version_puppies_photos\` (
      \`_order\` integer NOT NULL,
      \`_parent_id\` integer NOT NULL,
      \`id\` integer PRIMARY KEY NOT NULL,
      \`image_id\` integer,
      \`_uuid\` text,
      FOREIGN KEY (\`image_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY (\`_parent_id\`) REFERENCES \`_litters_v_version_puppies\`(\`id\`) ON UPDATE no action ON DELETE cascade
    );
  `);
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_photos_order_idx\` ON \`_litters_v_version_puppies_photos\` (\`_order\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_photos_parent_id_idx\` ON \`_litters_v_version_puppies_photos\` (\`_parent_id\`);`,
  );
  await db.run(
    sql`CREATE INDEX \`_litters_v_version_puppies_photos_image_idx\` ON \`_litters_v_version_puppies_photos\` (\`image_id\`);`,
  );

  // Перенос данных versions.
  await db.run(sql`
    INSERT INTO \`_litters_v_version_puppies_photos\` (\`_order\`, \`_parent_id\`, \`id\`, \`image_id\`)
    SELECT 0, id, NULL, photo_id
    FROM \`_litters_v_version_puppies\`
    WHERE photo_id IS NOT NULL;
  `);

  // `photo_id` колонку НЕ дропаем — SQLite не умеет DROP COLUMN на колонке с
  // FK без table-recreation, а наш FK к media был сложным (set null on delete).
  // Колонка становится dead — Payload её не читает (поле `photo` убрано из
  // Litters collection), новые записи туда не пишут. Очистится при следующем
  // table-recreation migration когда будет реальный повод.
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // photo_id остался на месте (не дропали в up), просто пере-заливаем туда
  // первое фото из photos массива.
  await db.run(sql`
    UPDATE \`litters_puppies\`
    SET \`photo_id\` = (
      SELECT image_id FROM \`litters_puppies_photos\`
      WHERE _parent_id = \`litters_puppies\`.id
      ORDER BY _order ASC LIMIT 1
    )
    WHERE \`photo_id\` IS NULL;
  `);
  await db.run(sql`
    UPDATE \`_litters_v_version_puppies\`
    SET \`photo_id\` = (
      SELECT image_id FROM \`_litters_v_version_puppies_photos\`
      WHERE _parent_id = \`_litters_v_version_puppies\`.id
      ORDER BY _order ASC LIMIT 1
    )
    WHERE \`photo_id\` IS NULL;
  `);
  await db.run(sql`DROP TABLE \`_litters_v_version_puppies_photos\`;`);
  await db.run(sql`DROP TABLE \`litters_puppies_photos\`;`);
}
