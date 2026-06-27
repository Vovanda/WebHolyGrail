# Versions and upgrade policy

> What we lock in, what we let drift, when we review majors.

## Pinned baseline (current)

| Stack         | Version          | Range                          | Where pinned                              |
| ------------- | ---------------- | ------------------------------ | ----------------------------------------- |
| Next.js       | `15.0.3`         | `^15.0.3` (minor + patch auto) | `src/{cms,client}/package.json`           |
| React         | `19.0.0`         | `^19.0.0`                      | `src/{cms,client}/package.json`           |
| Payload       | `3.40.0`         | `^3.40.0`                      | `src/cms/package.json`                    |
| TypeScript    | `5.6.3`          | `^5.6.3`                       | `src/{cms,client,contracts}/package.json` |
| Node.js       | `>=20.11.0`      | LTS, manual major              | `engines.node` (root + workspaces)        |
| pnpm          | `11.8.0`         | exact                          | `packageManager` (root)                   |
| `@types/node` | `22.10.0`        | `^22.10.0`                     | per workspace                             |
| `sharp`       | `0.33.5`         | `^0.33.5`                      | `src/cms/package.json`                    |
| Tailwind      | per package.json | caret                          | `src/client/package.json`                 |

## Range strategy

- **Caret (`^x.y.z`)** is default. Patch and minor upgrade automatically via `pnpm up` or fresh `pnpm install`. Breaking is by definition not allowed inside minor under semver — packages that violate this get pinned exactly.
- **Exact (`x.y.z`)** for `pnpm` (`packageManager` field) — guarantees reproducible installs.
- **Engines (`>=x`)** for Node — LTS major is a manual decision; runtime drift between dev and prod must stay zero.

## When to upgrade

| Class           | Frequency                          | Trigger                                                    |
| --------------- | ---------------------------------- | ---------------------------------------------------------- |
| Patch (`x.y.Z`) | continuous                         | next `pnpm install`                                        |
| Minor (`x.Y.z`) | continuous                         | next `pnpm install`                                        |
| Major (`X.y.z`) | quarterly review                   | manual: `pnpm outdated -r`, read changelog, branch + smoke |
| Node LTS        | every other Apr (per LTS schedule) | manual: Dockerfile + `engines.node` + CI matrix            |
| pnpm            | per packageManager release         | manual: `packageManager` bump + lockfile re-resolve        |

## Quarterly major-version audit

Run:

```bash
pnpm outdated -r
```

For each major bump shown:

1. Read the project's CHANGELOG / migration guide.
2. Estimate effort. Trivial → branch and bump. Non-trivial → backlog entry.
3. Run `pnpm dlx <project>-codemod` if one exists (Next, Payload, React all ship them).
4. `pnpm install` on the branch, `pnpm -r exec tsc --noEmit`, `pnpm dev` smoke.
5. Open PR, merge after review.
6. Sync to instances via `sync-template.sh` next.

## What stays unupgraded on purpose

- **`sharp`** — pinned wider than usual (`^0.33.5`) because `0.34.x` ships native-binding changes that need an explicit deploy-side check. Upgrade only after auditing VPS native arch.
- **`pnpm` major** — `pnpm 11.x` covers the project. Moving to `12.x` is a deliberate decision (workspace-protocol changes).

## Breaking-change discipline

When a major bump introduces a breaking change in template:

1. Tag the previous stable: `git tag v0.X.0 && git push --tags`.
2. Commit the upgrade on `main` with a `feat!` prefix and a clear migration note.
3. Bump template's own version in root `package.json`.
4. Document the migration in `docs/whg/migrations/<from>-to-<to>.md`.
5. Instance maintainers pull via `sync-template.sh --ref tag/v0.X.0` to stay on the old major, or follow the migration guide to take the new one.

Instances are free to pin to a specific template tag and upgrade on their own schedule — see [`whg-template-sync`](../../.claude/skills/whg-template-sync/SKILL.md).

## Why this strategy

- **No surprise majors** — caret keeps patch/minor automatic but never crosses majors. Saved us repeatedly from "yarn upgrade broke prod overnight".
- **Quarterly cadence** for majors — frequent enough to avoid 3-year migrations, sparse enough not to derail features.
- **Single locked Node + pnpm** — eliminates a class of "works on my machine" bugs. Dev/CI/prod must match exact same Node major and exact same pnpm.
