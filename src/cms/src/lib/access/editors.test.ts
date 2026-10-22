import type { CollectionConfig, Field, GlobalConfig } from 'payload';
import { describe, expect, it } from 'vitest';

import { engineCollections } from '../../collections/engine.js';
import { SiteSettings } from '../../globals/SiteSettings.js';
import { isAdmin, isEditor } from './editors.js';

/**
 * Инвариант движка: вошедший через чужую коллекцию (покупатель магазина)
 * получает не больше, чем гость. Даже если у него поле `role` равно `admin`
 * и номер совпадает с номером редактора.
 *
 * Тест обходит весь набор движка, поэтому новая коллекция попадает под
 * проверку сама.
 */
const GUEST = null;
const STRANGER = { id: 1, collection: 'customers', role: 'admin', email: 'x@example.com' };
const EDITOR = { id: 1, collection: 'users', role: 'admin', email: 'a@example.com' };

const OPS = ['read', 'create', 'update', 'delete', 'readVersions', 'unlock'] as const;

type AnyAccess = (args: unknown) => unknown;

async function ask(fn: AnyAccess, user: unknown): Promise<unknown> {
  const req = {
    user,
    payload: { find: async () => ({ docs: [], totalDocs: 0 }) },
    headers: new Headers(),
  };
  try {
    return await fn({
      req,
      id: 1,
      doc: { id: 1, uploadedBy: 1, author: 1, owner: 1 },
      data: {},
      siblingData: {},
    });
  } catch {
    // Функция, которой без живой базы не хватило данных, проверяется в своём тесте.
    return 'error';
  }
}

/** Ответ доступа «шире», чем у гостя: true или условие there, где у гостя отказ. */
const grants = (v: unknown): boolean => v === true || (typeof v === 'object' && v !== null);

function fieldsWithAccess(
  fields: Field[],
  path = '',
): Array<{ path: string; access: Record<string, AnyAccess> }> {
  const out: Array<{ path: string; access: Record<string, AnyAccess> }> = [];
  for (const f of fields) {
    const name = 'name' in f && f.name ? `${path}${f.name}` : path;
    if ('access' in f && f.access)
      out.push({ path: name, access: f.access as Record<string, AnyAccess> });
    if ('fields' in f && Array.isArray(f.fields))
      out.push(...fieldsWithAccess(f.fields, name ? `${name}.` : ''));
    if ('tabs' in f && Array.isArray(f.tabs)) {
      for (const tab of f.tabs) out.push(...fieldsWithAccess(tab.fields, name ? `${name}.` : ''));
    }
    if ('blocks' in f && Array.isArray(f.blocks)) {
      for (const b of f.blocks) out.push(...fieldsWithAccess(b.fields, `${name}.${b.slug}.`));
    }
  }
  return out;
}

const targets: Array<CollectionConfig | GlobalConfig> = [...engineCollections, SiteSettings];

describe('чужая учётная запись получает не больше гостя', () => {
  for (const target of targets) {
    const access = (target.access ?? {}) as Record<string, AnyAccess>;
    for (const op of OPS) {
      const fn = access[op];
      if (typeof fn !== 'function') continue;
      it(`${target.slug}: ${op}`, async () => {
        const guest = await ask(fn, GUEST);
        const stranger = await ask(fn, STRANGER);
        if (!grants(guest)) expect(grants(stranger)).toBe(false);
      });
    }

    for (const field of fieldsWithAccess(target.fields)) {
      for (const [op, fn] of Object.entries(field.access)) {
        if (typeof fn !== 'function') continue;
        it(`${target.slug}.${field.path}: ${op}`, async () => {
          const guest = await ask(fn, GUEST);
          const stranger = await ask(fn, STRANGER);
          if (!grants(guest)) expect(grants(stranger)).toBe(false);
        });
      }
    }
  }
});

describe('редактор и администратор', () => {
  it('редактор - тот, кто вошёл через users', () => {
    expect(isEditor(EDITOR)).toBe(true);
    expect(isEditor(STRANGER)).toBe(false);
    expect(isEditor(GUEST)).toBe(false);
  });

  it('роль admin в чужой коллекции администратором не делает', () => {
    expect(isAdmin(EDITOR)).toBe(true);
    expect(isAdmin(STRANGER)).toBe(false);
  });

  it('редактор по-прежнему пишет в коллекции движка', async () => {
    const pages = engineCollections.find((c) => c.slug === 'pages')!;
    expect(await ask(pages.access!.create as AnyAccess, EDITOR)).toBe(true);
  });
});
