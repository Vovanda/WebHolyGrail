import * as migration_20260627_094405_initial from './20260627_094405_initial';
import * as migration_20260714_171635_blog_collections_and_social_posts_rename from './20260714_171635_blog_collections_and_social_posts_rename';
import * as migration_20260725_145405_articles_section_block from './20260725_145405_articles_section_block';
import * as migration_20260725_185004_rich_text_block from './20260725_185004_rich_text_block';
import * as migration_20260727_203025_feature_grid_media_and_href from './20260727_203025_feature_grid_media_and_href';
import * as migration_20260802_140203_hero_cinematic_block from './20260802_140203_hero_cinematic_block';
import * as migration_20260802_145655_specialists_catalog from './20260802_145655_specialists_catalog';
import * as migration_20260802_151224_hero_watermark from './20260802_151224_hero_watermark';
import * as migration_20260802_153624_hero_logo_and_custom_markup from './20260802_153624_hero_logo_and_custom_markup';
import * as migration_20260802_170844_directory_view from './20260802_170844_directory_view';
import * as migration_20260802_175355_directory_top from './20260802_175355_directory_top';
import * as migration_20260802_182254_request_form_anchor from './20260802_182254_request_form_anchor';
import * as migration_20260802_193450_specialist_youtube from './20260802_193450_specialist_youtube';
import * as migration_20260802_193614_drop_specialist_site from './20260802_193614_drop_specialist_site';
import * as migration_20260803_130810_catch_up_settings_media_blocks from './20260803_130810_catch_up_settings_media_blocks';
import * as migration_20260803_164550_nav_children from './20260803_164550_nav_children';

export const migrations = [
  {
    up: migration_20260627_094405_initial.up,
    down: migration_20260627_094405_initial.down,
    name: '20260627_094405_initial',
  },
  {
    up: migration_20260714_171635_blog_collections_and_social_posts_rename.up,
    down: migration_20260714_171635_blog_collections_and_social_posts_rename.down,
    name: '20260714_171635_blog_collections_and_social_posts_rename',
  },
  {
    up: migration_20260725_145405_articles_section_block.up,
    down: migration_20260725_145405_articles_section_block.down,
    name: '20260725_145405_articles_section_block',
  },
  {
    up: migration_20260725_185004_rich_text_block.up,
    down: migration_20260725_185004_rich_text_block.down,
    name: '20260725_185004_rich_text_block',
  },
  {
    up: migration_20260727_203025_feature_grid_media_and_href.up,
    down: migration_20260727_203025_feature_grid_media_and_href.down,
    name: '20260727_203025_feature_grid_media_and_href',
  },
  {
    up: migration_20260802_140203_hero_cinematic_block.up,
    down: migration_20260802_140203_hero_cinematic_block.down,
    name: '20260802_140203_hero_cinematic_block',
  },
  {
    up: migration_20260802_145655_specialists_catalog.up,
    down: migration_20260802_145655_specialists_catalog.down,
    name: '20260802_145655_specialists_catalog',
  },
  {
    up: migration_20260802_151224_hero_watermark.up,
    down: migration_20260802_151224_hero_watermark.down,
    name: '20260802_151224_hero_watermark',
  },
  {
    up: migration_20260802_153624_hero_logo_and_custom_markup.up,
    down: migration_20260802_153624_hero_logo_and_custom_markup.down,
    name: '20260802_153624_hero_logo_and_custom_markup',
  },
  {
    up: migration_20260802_170844_directory_view.up,
    down: migration_20260802_170844_directory_view.down,
    name: '20260802_170844_directory_view',
  },
  {
    up: migration_20260802_175355_directory_top.up,
    down: migration_20260802_175355_directory_top.down,
    name: '20260802_175355_directory_top',
  },
  {
    up: migration_20260802_182254_request_form_anchor.up,
    down: migration_20260802_182254_request_form_anchor.down,
    name: '20260802_182254_request_form_anchor',
  },
  {
    up: migration_20260802_193450_specialist_youtube.up,
    down: migration_20260802_193450_specialist_youtube.down,
    name: '20260802_193450_specialist_youtube',
  },
  {
    up: migration_20260802_193614_drop_specialist_site.up,
    down: migration_20260802_193614_drop_specialist_site.down,
    name: '20260802_193614_drop_specialist_site',
  },
  {
    up: migration_20260803_130810_catch_up_settings_media_blocks.up,
    down: migration_20260803_130810_catch_up_settings_media_blocks.down,
    name: '20260803_130810_catch_up_settings_media_blocks',
  },
  {
    up: migration_20260803_164550_nav_children.up,
    down: migration_20260803_164550_nav_children.down,
    name: '20260803_164550_nav_children'
  },
];
