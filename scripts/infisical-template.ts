/**
 * infisical-template.ts — декларативный набор secret-ключей для нового WHG-сайта.
 *
 * Один source of truth по тому какие env-переменные нужны Payload+client+deploy.
 * Используется:
 *  - scripts/sync-infisical.ts — наполняет Infisical project значениями по slug/domain
 *  - scripts/setup-infisical.ts — seedSecrets из этого же list
 *  - docs/infra/scripts-and-workflows.md — auto-generated табличка (TODO)
 *
 * Категории:
 *  - HARDCODED:  значения детерминированно выводятся из slug + primaryDomain
 *  - GENERATED:  одноразовая генерация случайных secret'ов на bootstrap
 *  - EXTERNAL:   значения подтягиваются извне (например MinIO admin creds с VPS)
 *  - MANUAL:     значения вводит человек — sync кладёт placeholder с TODO
 */
export type SecretSpec =
  | { key: string; kind: 'hardcoded'; value: (ctx: TemplateContext) => string; comment?: string }
  | {
      key: string;
      kind: 'generated';
      generator: 'hex32' | 'hex16' | 'base64-24';
      comment?: string;
    }
  | { key: string; kind: 'external'; source: ExternalSource; comment?: string }
  | { key: string; kind: 'manual'; placeholder?: string; comment?: string };

export type ExternalSource =
  | { type: 'minio-admin-user' }
  | { type: 'minio-admin-password' }
  | { type: 'shared-services'; project: 'shared-services'; envSlug: string; key: string };

export interface TemplateContext {
  slug: string; // 'whg'
  primaryDomain: string; // 'whg.sawking.tech'
  rootDomain: string; // 'sawking.tech'
}

/**
 * Контекст из slug + primaryDomain. rootDomain — eTLD+1 от primaryDomain.
 */
export function contextFrom(slug: string, primaryDomain: string): TemplateContext {
  const parts = primaryDomain.split('.');
  const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : primaryDomain;
  return { slug, primaryDomain, rootDomain };
}

/**
 * WHG secret template — все env-переменные нужные Payload CMS + Next client + deploy.sh.
 *
 * Порядок намеренный: сначала core Payload, потом client URLs, потом S3/CDN,
 * в конце admin bootstrap. Менять порядок безопасно (это просто массив).
 */
export const WHG_SECRET_TEMPLATE: SecretSpec[] = [
  // --- Payload core ---
  {
    key: 'PAYLOAD_SECRET',
    kind: 'generated',
    generator: 'hex32',
    comment: 'JWT signing secret. НЕ менять после первого деплоя — invalidates all sessions.',
  },
  {
    key: 'DATABASE_URI',
    kind: 'hardcoded',
    value: (ctx) => `file:/data/${ctx.slug}.db`,
    comment: 'SQLite path в bind-mounted volume (cms container /data).',
  },
  {
    key: 'PAYLOAD_PUBLIC_SERVER_URL',
    kind: 'hardcoded',
    value: (ctx) => `https://${ctx.primaryDomain}`,
  },
  {
    key: 'PAYLOAD_ALLOWED_ORIGINS',
    kind: 'hardcoded',
    value: (ctx) => `https://${ctx.primaryDomain}`,
    comment: 'CSV для CORS/CSRF; добавлять дополнительные origins через запятую.',
  },

  // --- Client ---
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    kind: 'hardcoded',
    value: (ctx) => `https://${ctx.primaryDomain}`,
  },

  // --- S3 / Media ---
  {
    key: 'S3_BUCKET',
    kind: 'hardcoded',
    value: (ctx) => `${ctx.slug}-media`,
    comment: 'MinIO bucket name. nginx /media/ proxy_pass на этот bucket.',
  },
  {
    key: 'S3_REGION',
    kind: 'hardcoded',
    value: () => 'us-east-1',
    comment: 'Любой regional string — MinIO игнорит, нужен только S3-клиенту.',
  },
  {
    key: 'S3_ENDPOINT',
    kind: 'hardcoded',
    value: () => 'http://127.0.0.1:9100',
    comment: 'Host loopback для MinIO. Из cms-контейнера через host-network.',
  },
  {
    key: 'S3_PUBLIC_URL',
    kind: 'hardcoded',
    value: (ctx) => `https://${ctx.primaryDomain}/media`,
    comment: 'Same-origin proxy через nginx /media/ — без отдельного s3.<domain>.',
  },
  {
    key: 'S3_ACCESS_KEY_ID',
    kind: 'external',
    source: { type: 'minio-admin-user' },
    comment: 'MinIO root user (общий между всеми сайтами на VPS).',
  },
  {
    key: 'S3_SECRET_ACCESS_KEY',
    kind: 'external',
    source: { type: 'minio-admin-password' },
    comment: 'MinIO root password. TODO: ротировать на per-site IAM-user.',
  },

  // --- Admin bootstrap (создаётся при первом start Payload, если users empty) ---
  {
    key: 'ADMIN_INITIAL_EMAIL',
    kind: 'hardcoded',
    value: (ctx) => `admin@${ctx.rootDomain}`,
    comment: 'Email первого admin user. Сменить после первого входа в /admin/account.',
  },
  {
    key: 'ADMIN_INITIAL_PASSWORD',
    kind: 'generated',
    generator: 'base64-24',
    comment:
      'Пароль первого admin. Сменить после первого входа. Достаётся через ' +
      '`infisical secrets get ADMIN_INITIAL_PASSWORD --env=prod`.',
  },
];

/**
 * Helper: возвращает все hardcoded values resolved для данного context.
 * Используется в sync-infisical.ts для diff с тем что уже в Infisical.
 */
export function resolveHardcoded(
  template: SecretSpec[],
  ctx: TemplateContext,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const spec of template) {
    if (spec.kind === 'hardcoded') {
      out[spec.key] = spec.value(ctx);
    }
  }
  return out;
}

/**
 * Helper: список ключей которые требуют external / manual ввода.
 * sync-infisical.ts эти не создаёт автоматически — кладёт placeholder с TODO.
 */
export function externalAndManualKeys(template: SecretSpec[]): string[] {
  return template.filter((s) => s.kind === 'external' || s.kind === 'manual').map((s) => s.key);
}
