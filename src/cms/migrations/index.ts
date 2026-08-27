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
import * as migration_20260826_072342_threads_section_block from './20260826_072342_threads_section_block';
import * as migration_20260826_112035_video_hls from './20260826_112035_video_hls';
import * as migration_20260826_115716_video_block from './20260826_115716_video_block';
import * as migration_20260826_124235_video_soft_delete from './20260826_124235_video_soft_delete';
import * as migration_20260826_125952_video_author_and_code from './20260826_125952_video_author_and_code';
import * as migration_20260826_131100_user_channel from './20260826_131100_user_channel';
import * as migration_20260826_133934_playlists_entitlements from './20260826_133934_playlists_entitlements';
import * as migration_20260826_144110_access_codes from './20260826_144110_access_codes';
import * as migration_20260826_183023_media_title from './20260826_183023_media_title';
import * as migration_20260826_191836_media_derived from './20260826_191836_media_derived';
import * as migration_20260826_193016_video_set_block from './20260826_193016_video_set_block';
import * as migration_20260826_194734_demo_access_block from './20260826_194734_demo_access_block';
import * as migration_20260826_201412_video_set_modes from './20260826_201412_video_set_modes';
import * as migration_20260826_234502_carousel_block from './20260826_234502_carousel_block';
import * as migration_20260827_004108_carousel_source from './20260827_004108_carousel_source';
import * as migration_20260827_010605_player_ui from './20260827_010605_player_ui';

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
    name: '20260803_164550_nav_children',
  },
  {
    up: migration_20260826_072342_threads_section_block.up,
    down: migration_20260826_072342_threads_section_block.down,
    name: '20260826_072342_threads_section_block',
  },
  {
    up: migration_20260826_112035_video_hls.up,
    down: migration_20260826_112035_video_hls.down,
    name: '20260826_112035_video_hls',
  },
  {
    up: migration_20260826_115716_video_block.up,
    down: migration_20260826_115716_video_block.down,
    name: '20260826_115716_video_block',
  },
  {
    up: migration_20260826_124235_video_soft_delete.up,
    down: migration_20260826_124235_video_soft_delete.down,
    name: '20260826_124235_video_soft_delete',
  },
  {
    up: migration_20260826_125952_video_author_and_code.up,
    down: migration_20260826_125952_video_author_and_code.down,
    name: '20260826_125952_video_author_and_code',
  },
  {
    up: migration_20260826_131100_user_channel.up,
    down: migration_20260826_131100_user_channel.down,
    name: '20260826_131100_user_channel',
  },
  {
    up: migration_20260826_133934_playlists_entitlements.up,
    down: migration_20260826_133934_playlists_entitlements.down,
    name: '20260826_133934_playlists_entitlements',
  },
  {
    up: migration_20260826_144110_access_codes.up,
    down: migration_20260826_144110_access_codes.down,
    name: '20260826_144110_access_codes',
  },
  {
    up: migration_20260826_183023_media_title.up,
    down: migration_20260826_183023_media_title.down,
    name: '20260826_183023_media_title',
  },
  {
    up: migration_20260826_191836_media_derived.up,
    down: migration_20260826_191836_media_derived.down,
    name: '20260826_191836_media_derived',
  },
  {
    up: migration_20260826_193016_video_set_block.up,
    down: migration_20260826_193016_video_set_block.down,
    name: '20260826_193016_video_set_block',
  },
  {
    up: migration_20260826_194734_demo_access_block.up,
    down: migration_20260826_194734_demo_access_block.down,
    name: '20260826_194734_demo_access_block',
  },
  {
    up: migration_20260826_201412_video_set_modes.up,
    down: migration_20260826_201412_video_set_modes.down,
    name: '20260826_201412_video_set_modes',
  },
  {
    up: migration_20260826_234502_carousel_block.up,
    down: migration_20260826_234502_carousel_block.down,
    name: '20260826_234502_carousel_block',
  },
  {
    up: migration_20260827_004108_carousel_source.up,
    down: migration_20260827_004108_carousel_source.down,
    name: '20260827_004108_carousel_source',
  },
  {
    up: migration_20260827_010605_player_ui.up,
    down: migration_20260827_010605_player_ui.down,
    name: '20260827_010605_player_ui',
  },
];
