# Site scaffolding

> Status: experimental. Conventions are settling; the exact tooling around them is open.

## Approach

A new site is created by cloning the template, renaming, and filling in niche-specific content:

1. **Copy** `packages/_template/` into `sites/<site>/`.
2. **Rename** configuration variables: project name, domain, database name, namespace, palette tokens.
3. **Rename** the folder to match the new site.
4. **Plan pages** — manually or with an LLM agent: pick the page set for the niche (home, about, services, contacts, catalogue, contact form, etc.).
5. **Scaffold content** — a script (or agent acting through the Payload Local API) creates pages from blocks and fills them with realistic content.

The split: the scaffold is deterministic and identical across sites; the intelligence (which pages, which content) lives in whatever drives step 4-5 — a human, a script, or an agent.

## Implications for tooling

If the baseline is "copy + rename + fill in content", then for the first sites a heavy scaffolding platform (Nx) — or even a template generator (Plop) — is not required. What is needed:

- a deterministic rename step (a small Bash/Node script);
- something intelligent for the content pass (a human, an agent skill, a custom CLI).

A full scaffolding platform becomes relevant later, when many sites are being produced from the same template.

## Open questions

1. **Rename step:** deterministic script vs. agent-driven? Likely a hybrid — the script does the mechanical rename, the agent handles content analysis.
2. **Page-creation CLI:** custom script over Payload Local API, or an agent calling Payload through MCP, or a Plop-style generator?
3. **Template parameterisation:** environment variables, a single `site.config.ts` (name, domain, DB, palette in one place), or placeholder substitution?
4. **When to bring in pnpm workspaces and Turborepo:** not on day one with a single site. Becomes load-bearing once `@holygrail/ui` is actually consumed across sites.
5. **Whether a dedicated scaffold tool is needed at all,** or whether an agent skill named `new-site` covers the use case.

## Reference: scaffolding tools in the TypeScript/JavaScript ecosystem

**Monorepo orchestration:**

- **Turborepo** — fast incremental builds, minimal config, native Next.js support. No code generators of its own.
- **Nx** — full platform: generators, module-boundary enforcement, affected-graph commands. Heavier.
- **pnpm workspaces** — lightweight package linking; the baseline for monorepos.

**File generation:**

- **Plop.js** — Handlebars-based generator.
- **Hygen** — alternative to Plop.
- **Nx generators** — more capable (AST transforms), at the cost of platform weight.

## Current direction

A combination of pnpm workspaces + Turborepo (orchestration) + Plop or `turbo gen` (deterministic file scaffolding), with an agent layered on top for content. Nx is intentionally avoided here — its strongest value (smart generators) is provided by the agent layer instead.
