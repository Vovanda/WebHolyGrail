import * as migration_20260625_140103_baseline from './20260625_140103_baseline';
import * as migration_20260626_194947_add_landing_v2_blocks from './20260626_194947_add_landing_v2_blocks';

export const migrations = [
  {
    up: migration_20260625_140103_baseline.up,
    down: migration_20260625_140103_baseline.down,
    name: '20260625_140103_baseline',
  },
  {
    up: migration_20260626_194947_add_landing_v2_blocks.up,
    down: migration_20260626_194947_add_landing_v2_blocks.down,
    name: '20260626_194947_add_landing_v2_blocks',
  },
];
