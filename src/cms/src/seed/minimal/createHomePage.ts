import type { Payload } from 'payload';

export async function createHomePage(payload: Payload): Promise<{ created: boolean; id: string }> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    return { created: false, id: String(existing.docs[0]!.id) };
  }

  const page = await payload.create({
    collection: 'pages',
    data: {
      title: 'Home',
      slug: 'home',
      blocks: [],
      _status: 'published',
    },
  });

  return { created: true, id: String(page.id) };
}
