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
    return { created: false, id: String(existing.docs[0]!.id) };
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
