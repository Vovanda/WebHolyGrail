import { translitSlug } from './src/lib/slug.ts';
for (const s of ['Проба канала', 'Алексей Самбулов', 'Оля', 'Николай']) console.log(JSON.stringify(s), '→', JSON.stringify(translitSlug(s, 24)));
