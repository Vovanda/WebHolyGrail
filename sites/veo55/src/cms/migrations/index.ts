import * as migration_20260619_130020_baseline from './20260619_130020_baseline';
import * as migration_20260619_134512_timeline_visible_count from './20260619_134512_timeline_visible_count';
import * as migration_20260619_135514_timeline_sort from './20260619_135514_timeline_sort';
import * as migration_20260619_142243_wave_divider_flipped from './20260619_142243_wave_divider_flipped';
import * as migration_20260619_144314_contacts_hours from './20260619_144314_contacts_hours';
import * as migration_20260619_171022_dogs_collection from './20260619_171022_dogs_collection';

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
];
