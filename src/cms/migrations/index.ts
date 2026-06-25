import * as migration_20260625_140103_baseline from './20260625_140103_baseline';

export const migrations = [
  {
    up: migration_20260625_140103_baseline.up,
    down: migration_20260625_140103_baseline.down,
    name: '20260625_140103_baseline',
  },
];
