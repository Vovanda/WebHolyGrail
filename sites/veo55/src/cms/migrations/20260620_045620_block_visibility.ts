import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_quote\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_quote\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_quote\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_prose\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_prose\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_prose\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_header\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_header\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_header\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_puppies\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_puppies\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_puppies\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`visibility_desktop\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`visibility_tablet\` integer DEFAULT true;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`visibility_mobile\` integer DEFAULT true;`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_card\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_card\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_card\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_header\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_header\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_header\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_pair_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_litter_puppies\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_puppies\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_litter_puppies\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_litter_card\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_litter_card\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_header\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_litter_puppies\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`visibility_desktop\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`visibility_tablet\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`visibility_mobile\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_header\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_pair_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_litter_puppies\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_header\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_pair_card\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_litter_puppies\` DROP COLUMN \`visibility_mobile\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`visibility_desktop\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`visibility_tablet\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`visibility_mobile\`;`,
  );
}
