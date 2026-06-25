# Where data lives — runtime config, secrets, content

> Provisional. We're locking the rule "split by who changes it, not by data type" at the start of the project. Time will tell if the trade-offs hold. Document open questions are at the end.

## The rule

Holy Grail splits values across three storage layers based on **who changes them**, not on what type of data they are.

| Who changes | Where | What goes there |
|---|---|---|
| **Content manager** (non-technical, via UI, no deploy) | Payload `SiteSettings` global + collections | siteName, contacts, mainNav, footer, theme name, brand palette name, domain entities (Posts, Products, Customers, …) |
| **Developer / DevOps** (via CLI/UI, no deploy) | Infisical Cloud | Secrets, env-dependent runtime (URLs, S3 config, ALLOWED_ORIGINS), **feature flags**, **rate limits**, technical knobs |
| **No one** (only with a code release) | Code | TypeScript types, app structure (routes, Dockerfile), R-rule constants used in comments / linting |

## Why this split

- **Content manager** is non-technical. They live in Payload admin. They should never have to touch Infisical UI, env files, or code.
- **DevOps / developer** wants to toggle behaviour fast, ideally without redeploying. Infisical gives that: change a flag → next container start picks it up. Same env variable shape across dev / staging / prod.
- **Code** is for things that genuinely never change without a release. Putting a feature flag like `ENABLE_NEW_DASHBOARD` in code means every toggle = deploy + downtime. That defeats the purpose of having a flag.

The mistake to avoid: classifying values by **what they are** ("constants go in code, content goes in CMS"). That misses the question "who changes this, and when?"

## What this means for typical values

- **Feature flags** — Infisical. Toggle through env, no rebuild.
- **Rate limits, retry counts, default cache TTL** — Infisical. DevOps knobs.
- **Supported locales list** — Infisical (changing it is a config decision, not a content decision).
- **Brand colors / theme name** — Payload `SiteSettings` (a content / brand decision).
- **Site name, contacts, social links** — Payload.
- **API endpoints, S3 bucket name** — Infisical (env-dependent).
- **TypeScript interfaces, Zod schemas, route definitions** — code.

## Where this might bite us (we don't know yet)

The rule is opinionated and Infisical-heavy. Some things to watch as we run the first sites:

- **Infisical free-tier limits.** If we end up with hundreds of small flags + many environments, we may hit secrets-per-project caps. Mitigation: namespace flags (`flags.dashboard.new = true`), group into structured secrets, or move to paid tier.
- **Latency on cold start.** `infisical run` resolves secrets at process start. If a site has 100+ secrets, startup will slow down. Mitigation: trim what actually lives in Infisical, or use Payload for less-sensitive values.
- **Audit / version history.** Infisical keeps history per secret, but the diff UX is per-key, not per-deploy. If we end up doing complex coordinated config changes, we may want code-review-style flow (PR through git). Mitigation later if it bites: keep config as code in a small `config/` folder, sync to Infisical via a script.
- **Vendor lock-in.** If Infisical goes down or pricing changes, we're migrating dozens of project configs. Mitigation: keep `.env.example` accurate (lists every variable used), so migration to another provider is mechanical.
- **No clear answer for "both content and devops change this"** — e.g. site banner toggle (marketing manager wants it for sales campaigns, devops wants it for outages). Currently: default to Payload. Watch if it causes friction.
- **Local-dev UX.** Developers without Infisical CLI installed can't run the dev stack. `dev-setup.sh` enforces install. So far that's fine; if onboarding pain grows, we add a "demo mode" that runs from a fixture file.

## When we revisit

- After scaffolding 3+ instances and watching what kinds of config drift between them.
- If Infisical free tier becomes restrictive.
- If the "who changes this?" question is repeatedly hard to answer for new values — the rule may need a fourth category.

For now, treat this as the working default. Don't fight it on a case-by-case basis; if a value doesn't fit, raise it as an architectural question.

## Cross-references

- [`30-philosophy.md`](30-philosophy.md) — R0 (content in DB, not code) and how it relates.
- [`holygrail-infisical` skill](../../.claude/skills/holygrail-infisical/SKILL.md) — operational details.
- [`feedback_data_location_by_who_changes_it`](../../) (private memory) — short-form rule for agent sessions.
