/**
 * Снимок схемы рядом с миграцией, написанной руками.
 *
 * @remarks
 * Расхождение проверяется сравнением снимка кода с последним `.json`
 * в migrations/. Миграция без снимка проверку не проходит: сравнивать её
 * не с чем. Генератор берётся тот же, которым пользуется сама проверка.
 */
import fs from 'fs';
import { getPayload } from 'payload';

import config from '../src/payload.config.js';

const payload = await getPayload({ config, disableOnInit: true });
const adapter = payload.db as unknown as {
  schema: unknown;
  requireDrizzleKit: () => { generateDrizzleJson: (schema: unknown) => Promise<unknown> };
};

const { generateDrizzleJson } = adapter.requireDrizzleKit();
const snapshot = await generateDrizzleJson(adapter.schema);

const out = process.argv[2];
if (!out) {
  console.error('Куда писать снимок: pnpm tsx scripts/write-snapshot.ts migrations/<имя>.json');
  process.exit(1);
}

fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
console.log(`снимок записан: ${out}`);
process.exit(0);
