import { describe, expect, it } from 'vitest';

import { KEEP_FILENAME, normalizeUploadName } from './media-hooks';

type HookArgs = Parameters<typeof normalizeUploadName>[0];

const run = (name: string, context: Record<string, unknown> = {}) => {
  const file = { name };
  normalizeUploadName({ operation: 'update', context, req: { file } } as unknown as HookArgs);
  return file.name;
};

describe('имя залитого файла', () => {
  it('обычная заливка приводит имя к латинице', () => {
    expect(run('Савкин Николай.webp')).toBe('savkin-nikolay.webp');
  });

  it('пересборка под прежним именем имя не трогает', () => {
    expect(run('Savkin-Nikolaj-Genadevic.webp', { [KEEP_FILENAME]: true })).toBe(
      'Savkin-Nikolaj-Genadevic.webp',
    );
  });
});
