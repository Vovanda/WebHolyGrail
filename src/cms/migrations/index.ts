import * as migration_20260625_140103_baseline from './20260625_140103_baseline';
import * as migration_20260626_194947_add_landing_v2_blocks from './20260626_194947_add_landing_v2_blocks';
import * as migration_20260627_052649_add_feature_grid_details from './20260627_052649_add_feature_grid_details';
import * as migration_20260627_054720_add_jobs_config from './20260627_054720_add_jobs_config';
import * as migration_20260627_055803_add_separator_variants from './20260627_055803_add_separator_variants';

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
  {
    up: migration_20260627_052649_add_feature_grid_details.up,
    down: migration_20260627_052649_add_feature_grid_details.down,
    name: '20260627_052649_add_feature_grid_details',
  },
  {
    up: migration_20260627_054720_add_jobs_config.up,
    down: migration_20260627_054720_add_jobs_config.down,
    name: '20260627_054720_add_jobs_config',
  },
  {
    up: migration_20260627_055803_add_separator_variants.up,
    down: migration_20260627_055803_add_separator_variants.down,
    name: '20260627_055803_add_separator_variants',
  },
];
