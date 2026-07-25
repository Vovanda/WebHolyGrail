import * as migration_20260627_094405_initial from './20260627_094405_initial';
import * as migration_20260714_171635_blog_collections_and_social_posts_rename from './20260714_171635_blog_collections_and_social_posts_rename';
import * as migration_20260725_145405_articles_section_block from './20260725_145405_articles_section_block';

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
];
