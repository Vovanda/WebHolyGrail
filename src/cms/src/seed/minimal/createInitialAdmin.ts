import type { Payload } from 'payload';

interface CreateAdminInput {
  email: string;
  password: string;
  name?: string;
}

export async function createInitialAdmin(
  payload: Payload,
  input: CreateAdminInput,
): Promise<{ created: boolean; id: string }> {
  const existing = await payload.find({
    collection: 'users',
    where: { email: { equals: input.email } },
    limit: 1,
  });

  if (existing.docs.length > 0) {
    const doc = existing.docs[0]!;
    // SEED_FORCE_ADMIN_PASSWORD=1 — force-update password существующего admin
    // (для случая когда первый seed дал случайный password, а нужен предсказуемый).
    if (process.env['SEED_FORCE_ADMIN_PASSWORD'] === '1') {
      await payload.update({
        collection: 'users',
        id: doc.id,
        data: { password: input.password },
      });
    }
    return { created: false, id: String(doc.id) };
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      email: input.email,
      password: input.password,
      name: input.name ?? 'Admin',
      role: 'admin',
    },
  });

  return { created: true, id: String(user.id) };
}
