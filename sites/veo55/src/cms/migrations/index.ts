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
];
