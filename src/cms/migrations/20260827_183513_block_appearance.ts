// @safe-bluegreen - только добавление колонок, старый цвет их не читает
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-sqlite';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_banner_slider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_split\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_hero_cinematic\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_custom_markup\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_custom_markup\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_custom_markup\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_request_form\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_profile\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_profile\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_profile\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_profile\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_profile\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_list\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_list\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_document_list\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_install_snippet\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_install_snippet\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_install_snippet\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_install_snippet\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_stack_transparency\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_stack_transparency\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_stack_transparency\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_stack_transparency\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_stack_transparency\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_comparison_table\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_comparison_table\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_comparison_table\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_comparison_table\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_feature_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_built_with\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_cta_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_rich_text\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_wave_divider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_achievement_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_certified_notice\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_certified_notice\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_certified_notice\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_certified_notice\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_social_feed\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_articles_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_articles_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_articles_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_articles_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_threads_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_threads_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_threads_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_threads_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_video_set\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_demo_access\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_faq_accordion\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_faq_accordion\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_faq_accordion\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_project_types_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_block_showcase\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_block_showcase\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_block_showcase\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`pages_blocks_block_showcase\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_reusable_ref\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_carousel\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_split\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_request_form\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_list\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_list\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_list\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_document_list\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_built_with\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_built_with\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_built_with\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_timeline\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_rich_text\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_social_feed\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_social_feed\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_social_feed\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_social_feed\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_articles_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_articles_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_articles_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_articles_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_articles_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_threads_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_threads_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_threads_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_threads_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_threads_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` ADD \`corner_scope\` text DEFAULT 'all';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_video_set\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_demo_access\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_demo_access\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_demo_access\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_demo_access\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_page_ref\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_quote\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_prose\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_banner_slider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_banner_slider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_banner_slider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_banner_slider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_banner_slider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_carousel\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_split\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_split\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_split\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_split\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_custom_markup\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_custom_markup\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_custom_markup\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_custom_markup\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_custom_markup\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_request_form\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_document_list\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_document_list\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_document_list\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_document_list\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_document_list\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_feature_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_feature_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_feature_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_feature_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_feature_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_built_with\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_built_with\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_built_with\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_built_with\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_cta_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_cta_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_cta_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_cta_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_quote\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_timeline\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_timeline\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_timeline\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_timeline\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_prose\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_rich_text\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_rich_text\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_rich_text\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_rich_text\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_wave_divider\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_wave_divider\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_wave_divider\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_wave_divider\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_wave_divider\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_social_feed\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_social_feed\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_social_feed\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_social_feed\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_social_feed\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` ADD \`gap_below\` text DEFAULT 'md';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` ADD \`padding\` text DEFAULT 'none';`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` ADD \`radius\` text DEFAULT 'none';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_video_set\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_demo_access\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_demo_access\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_demo_access\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_demo_access\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_demo_access\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_faq_accordion\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_faq_accordion\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_faq_accordion\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_faq_accordion\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_faq_accordion\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_reusable_ref\` ADD \`space\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_reusable_ref\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_reusable_ref\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_reusable_ref\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_reusable_ref\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` ADD \`space\` text DEFAULT 'md';`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_page_ref\` ADD \`gap_below\` text DEFAULT 'md';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_page_ref\` ADD \`padding\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_page_ref\` ADD \`radius\` text DEFAULT 'none';`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_page_ref\` ADD \`corner_scope\` text DEFAULT 'all';`,
  );
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_banner_slider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_carousel\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_split\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_hero_cinematic\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_custom_markup\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_request_form\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_directory\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_directory\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_directory\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_directory\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`pages_blocks_specialist_directory\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_profile\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_profile\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_profile\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_profile\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_specialist_profile\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_document_list\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_install_snippet\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_stack_transparency\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_stack_transparency\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_stack_transparency\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_stack_transparency\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_stack_transparency\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_comparison_table\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_feature_grid\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_built_with\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_cta_banner\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_quote\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_timeline\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_prose\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_rich_text\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_wave_divider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_achievement_banner\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_certified_notice\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_social_feed\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_articles_section\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_threads_section\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_video_set\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_demo_access\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_faq_accordion\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_project_types_grid\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_block_showcase\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_reusable_ref\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`pages_blocks_page_ref\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_banner_slider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_carousel\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_split\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_hero_cinematic\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_custom_markup\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_request_form\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_directory\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_specialist_profile\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_document_list\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_install_snippet\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_stack_transparency\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_comparison_table\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_feature_grid\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_built_with\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_cta_banner\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_quote\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_timeline\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_prose\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_rich_text\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_wave_divider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_achievement_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_certified_notice\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_social_feed\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_articles_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_articles_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_articles_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_articles_section\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_articles_section\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_threads_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_threads_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_threads_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_threads_section\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_threads_section\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_video_set\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_demo_access\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_faq_accordion\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_pages_v_blocks_project_types_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_block_showcase\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_reusable_ref\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_pages_v_blocks_page_ref\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_banner_slider\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_carousel\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_split\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_hero_cinematic\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_custom_markup\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_request_form\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_directory\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_specialist_profile\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_document_list\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` DROP COLUMN \`padding\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_install_snippet\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_stack_transparency\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_comparison_table\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_feature_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_built_with\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_cta_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_quote\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_timeline\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_prose\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_rich_text\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_wave_divider\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_achievement_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_certified_notice\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_social_feed\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_articles_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` DROP COLUMN \`padding\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_threads_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_video_set\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_demo_access\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_faq_accordion\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_project_types_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`reusable_blocks_blocks_block_showcase\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_banner_slider\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_carousel\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_split\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_hero_cinematic\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_custom_markup\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`padding\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_request_form\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_directory\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_specialist_profile\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_document_list\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_install_snippet\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_stack_transparency\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_comparison_table\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`padding\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_feature_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_built_with\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_cta_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_quote\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_timeline\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_prose\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_rich_text\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`padding\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_wave_divider\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_achievement_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_certified_notice\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_social_feed\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_articles_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_threads_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_video_set\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_demo_access\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_faq_accordion\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_project_types_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` DROP COLUMN \`space\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`_reusable_blocks_v_blocks_block_showcase\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_banner_slider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_banner_slider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_banner_slider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_banner_slider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_banner_slider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_carousel\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_split\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_hero_cinematic\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_custom_markup\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_custom_markup\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_custom_markup\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_custom_markup\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_custom_markup\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_request_form\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_specialist_directory\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` DROP COLUMN \`padding\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` DROP COLUMN \`radius\`;`,
  );
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_directory\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_specialist_profile\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_specialist_profile\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_specialist_profile\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_specialist_profile\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_document_list\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_document_list\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_document_list\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_document_list\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_document_list\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_install_snippet\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_install_snippet\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_install_snippet\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_install_snippet\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_install_snippet\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_stack_transparency\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_stack_transparency\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_stack_transparency\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_stack_transparency\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_comparison_table\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_comparison_table\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_comparison_table\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_comparison_table\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_comparison_table\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_feature_grid\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_feature_grid\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_feature_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_feature_grid\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_feature_grid\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_built_with\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_cta_banner\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_quote\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_timeline\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_prose\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_rich_text\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_wave_divider\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_wave_divider\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_wave_divider\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_wave_divider\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_wave_divider\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_achievement_banner\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_achievement_banner\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_achievement_banner\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_achievement_banner\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_certified_notice\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_certified_notice\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_certified_notice\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_certified_notice\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_certified_notice\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_social_feed\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_social_feed\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_social_feed\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_social_feed\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_social_feed\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_articles_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_articles_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_articles_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_articles_section\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_articles_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_threads_section\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_threads_section\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_threads_section\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_threads_section\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_threads_section\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_video_set\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_demo_access\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_demo_access\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_demo_access\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_demo_access\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_demo_access\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_faq_accordion\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_faq_accordion\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_faq_accordion\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_faq_accordion\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_faq_accordion\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_project_types_grid\` DROP COLUMN \`space\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` DROP COLUMN \`gap_below\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_project_types_grid\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_project_types_grid\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_project_types_grid\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_block_showcase\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_block_showcase\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_block_showcase\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_block_showcase\` DROP COLUMN \`radius\`;`);
  await db.run(
    sql`ALTER TABLE \`specialists_blocks_block_showcase\` DROP COLUMN \`corner_scope\`;`,
  );
  await db.run(sql`ALTER TABLE \`specialists_blocks_reusable_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_reusable_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_reusable_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_reusable_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_reusable_ref\` DROP COLUMN \`corner_scope\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` DROP COLUMN \`space\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` DROP COLUMN \`gap_below\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` DROP COLUMN \`padding\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` DROP COLUMN \`radius\`;`);
  await db.run(sql`ALTER TABLE \`specialists_blocks_page_ref\` DROP COLUMN \`corner_scope\`;`);
}
