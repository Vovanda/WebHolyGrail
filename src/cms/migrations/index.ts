import * as migration_20260627_094405_initial from './20260627_094405_initial';
import * as migration_20260714_171635_blog_collections_and_social_posts_rename from './20260714_171635_blog_collections_and_social_posts_rename';

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
];
