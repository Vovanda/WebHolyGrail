import type { Field } from 'payload';
import { describe, expect, it } from 'vitest';

import { GalleryBlock } from './Gallery';

/** Имена всех полей блока, включая вложенные в секции и ряды. */
function fieldNames(fields: readonly Field[]): string[] {
  return fields.flatMap((field) => [
    ...('name' in field && field.name ? [field.name] : []),
    ...('fields' in field && Array.isArray(field.fields) ? fieldNames(field.fields) : []),
  ]);
}

describe('блок галереи', () => {
  it('без раскладки плиток: её плитку рисует AspectRows по формам снимков', () => {
    expect(fieldNames(GalleryBlock.fields).filter((name) => name.startsWith('tileLayout'))).toEqual(
      [],
    );
  });
});
