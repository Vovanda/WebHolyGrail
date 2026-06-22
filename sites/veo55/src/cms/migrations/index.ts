import * as migration_20260619_130020_baseline from './20260619_130020_baseline';
import * as migration_20260619_134512_timeline_visible_count from './20260619_134512_timeline_visible_count';
import * as migration_20260619_135514_timeline_sort from './20260619_135514_timeline_sort';
import * as migration_20260619_142243_wave_divider_flipped from './20260619_142243_wave_divider_flipped';
import * as migration_20260619_144314_contacts_hours from './20260619_144314_contacts_hours';
import * as migration_20260619_171022_dogs_collection from './20260619_171022_dogs_collection';
import * as migration_20260619_171313_litters_collection from './20260619_171313_litters_collection';
import * as migration_20260619_171505_litter_card_block from './20260619_171505_litter_card_block';
import * as migration_20260619_194643_add_s3_storage_prefix from './20260619_194643_add_s3_storage_prefix';
import * as migration_20260619_195944_rename_paircard_image_to_images from './20260619_195944_rename_paircard_image_to_images';
import * as migration_20260620_013915_add_achievement_banner from './20260620_013915_add_achievement_banner';
import * as migration_20260620_042358_litter_decomposition from './20260620_042358_litter_decomposition';
import * as migration_20260620_045212_reusable_and_page_refs from './20260620_045212_reusable_and_page_refs';
import * as migration_20260620_045620_block_visibility from './20260620_045620_block_visibility';
import * as migration_20260620_050000_litter_letter from './20260620_050000_litter_letter';
import * as migration_20260620_122900_certified_notice from './20260620_122900_certified_notice';
import * as migration_20260620_135000_pedigree from './20260620_135000_pedigree';
import * as migration_20260620_140000_pedigree_v_table_rename from './20260620_140000_pedigree_v_table_rename';
import * as migration_20260620_165000_posts_collection from './20260620_165000_posts_collection';
import * as migration_20260620_170000_social_feed_block from './20260620_170000_social_feed_block';
import * as migration_20260620_171000_posts_locked_rels from './20260620_171000_posts_locked_rels';
import * as migration_20260620_172000_social_feed_sources_autoinc from './20260620_172000_social_feed_sources_autoinc';
import * as migration_20260620_180000_comments_collection from './20260620_180000_comments_collection';
import * as migration_20260620_185000_payload_jobs from './20260620_185000_payload_jobs';
import * as migration_20260620_210000_faq_groups from './20260620_210000_faq_groups';
import * as migration_20260620_211000_pages_rels from './20260620_211000_pages_rels';
import * as migration_20260621_030000_litters_dob_approx from './20260621_030000_litters_dob_approx';
import * as migration_20260621_155000_dogs_aliases from './20260621_155000_dogs_aliases';
import * as migration_20260621_160000_payload_jobs_stats_rename from './20260621_160000_payload_jobs_stats_rename';
import * as migration_20260621_165000_puppy_photos_array from './20260621_165000_puppy_photos_array';
import * as migration_20260621_170000_media_prefix from './20260621_170000_media_prefix';
import * as migration_20260622_230000_dogs_kennel_breeder from './20260622_230000_dogs_kennel_breeder';

export const migrations = [
  {
    up: migration_20260619_130020_baseline.up,
    down: migration_20260619_130020_baseline.down,
    name: '20260619_130020_baseline',
  },
  {
    up: migration_20260619_134512_timeline_visible_count.up,
    down: migration_20260619_134512_timeline_visible_count.down,
    name: '20260619_134512_timeline_visible_count',
  },
  {
    up: migration_20260619_135514_timeline_sort.up,
    down: migration_20260619_135514_timeline_sort.down,
    name: '20260619_135514_timeline_sort',
  },
  {
    up: migration_20260619_142243_wave_divider_flipped.up,
    down: migration_20260619_142243_wave_divider_flipped.down,
    name: '20260619_142243_wave_divider_flipped',
  },
  {
    up: migration_20260619_144314_contacts_hours.up,
    down: migration_20260619_144314_contacts_hours.down,
    name: '20260619_144314_contacts_hours',
  },
  {
    up: migration_20260619_171022_dogs_collection.up,
    down: migration_20260619_171022_dogs_collection.down,
    name: '20260619_171022_dogs_collection',
  },
  {
    up: migration_20260619_171313_litters_collection.up,
    down: migration_20260619_171313_litters_collection.down,
    name: '20260619_171313_litters_collection',
  },
  {
    up: migration_20260619_171505_litter_card_block.up,
    down: migration_20260619_171505_litter_card_block.down,
    name: '20260619_171505_litter_card_block',
  },
  {
    up: migration_20260619_194643_add_s3_storage_prefix.up,
    down: migration_20260619_194643_add_s3_storage_prefix.down,
    name: '20260619_194643_add_s3_storage_prefix',
  },
  {
    up: migration_20260619_195944_rename_paircard_image_to_images.up,
    down: migration_20260619_195944_rename_paircard_image_to_images.down,
    name: '20260619_195944_rename_paircard_image_to_images',
  },
  {
    up: migration_20260620_013915_add_achievement_banner.up,
    down: migration_20260620_013915_add_achievement_banner.down,
    name: '20260620_013915_add_achievement_banner',
  },
  {
    up: migration_20260620_042358_litter_decomposition.up,
    down: migration_20260620_042358_litter_decomposition.down,
    name: '20260620_042358_litter_decomposition',
  },
  {
    up: migration_20260620_045212_reusable_and_page_refs.up,
    down: migration_20260620_045212_reusable_and_page_refs.down,
    name: '20260620_045212_reusable_and_page_refs',
  },
  {
    up: migration_20260620_045620_block_visibility.up,
    down: migration_20260620_045620_block_visibility.down,
    name: '20260620_045620_block_visibility',
  },
  {
    up: migration_20260620_050000_litter_letter.up,
    down: migration_20260620_050000_litter_letter.down,
    name: '20260620_050000_litter_letter',
  },
  {
    up: migration_20260620_122900_certified_notice.up,
    down: migration_20260620_122900_certified_notice.down,
    name: '20260620_122900_certified_notice',
  },
  {
    up: migration_20260620_135000_pedigree.up,
    down: migration_20260620_135000_pedigree.down,
    name: '20260620_135000_pedigree',
  },
  {
    up: migration_20260620_140000_pedigree_v_table_rename.up,
    down: migration_20260620_140000_pedigree_v_table_rename.down,
    name: '20260620_140000_pedigree_v_table_rename',
  },
  {
    up: migration_20260620_165000_posts_collection.up,
    down: migration_20260620_165000_posts_collection.down,
    name: '20260620_165000_posts_collection',
  },
  {
    up: migration_20260620_170000_social_feed_block.up,
    down: migration_20260620_170000_social_feed_block.down,
    name: '20260620_170000_social_feed_block',
  },
  {
    up: migration_20260620_171000_posts_locked_rels.up,
    down: migration_20260620_171000_posts_locked_rels.down,
    name: '20260620_171000_posts_locked_rels',
  },
  {
    up: migration_20260620_172000_social_feed_sources_autoinc.up,
    down: migration_20260620_172000_social_feed_sources_autoinc.down,
    name: '20260620_172000_social_feed_sources_autoinc',
  },
  {
    up: migration_20260620_180000_comments_collection.up,
    down: migration_20260620_180000_comments_collection.down,
    name: '20260620_180000_comments_collection',
  },
  {
    up: migration_20260620_185000_payload_jobs.up,
    down: migration_20260620_185000_payload_jobs.down,
    name: '20260620_185000_payload_jobs',
  },
  {
    up: migration_20260620_210000_faq_groups.up,
    down: migration_20260620_210000_faq_groups.down,
    name: '20260620_210000_faq_groups',
  },
  {
    up: migration_20260620_211000_pages_rels.up,
    down: migration_20260620_211000_pages_rels.down,
    name: '20260620_211000_pages_rels',
  },
  {
    up: migration_20260621_030000_litters_dob_approx.up,
    down: migration_20260621_030000_litters_dob_approx.down,
    name: '20260621_030000_litters_dob_approx',
  },
  {
    up: migration_20260621_155000_dogs_aliases.up,
    down: migration_20260621_155000_dogs_aliases.down,
    name: '20260621_155000_dogs_aliases',
  },
  {
    up: migration_20260621_160000_payload_jobs_stats_rename.up,
    down: migration_20260621_160000_payload_jobs_stats_rename.down,
    name: '20260621_160000_payload_jobs_stats_rename',
  },
  {
    up: migration_20260621_165000_puppy_photos_array.up,
    down: migration_20260621_165000_puppy_photos_array.down,
    name: '20260621_165000_puppy_photos_array',
  },
  {
    up: migration_20260621_170000_media_prefix.up,
    down: migration_20260621_170000_media_prefix.down,
    name: '20260621_170000_media_prefix',
  },
  {
    up: migration_20260622_230000_dogs_kennel_breeder.up,
    down: migration_20260622_230000_dogs_kennel_breeder.down,
    name: '20260622_230000_dogs_kennel_breeder',
  },
];
