# Overview

> Entry point. Read this first, then dive into [`30-philosophy.md`](30-philosophy.md) for the rules.

## What WHG is

**Web Holy Grail** is a framework-pack of MIT-licensed tools — the minimum needed to build a fast, maintainable website with sane architecture baked in from the start.

It is **not** a single library. It's a curated set of components that work well together (Next.js + Payload + Postgres/SQLite + Docker + a few others), wired with conventions for how they connect. The set is **opinionated but replaceable**: any one tool can be swapped without rewriting the rest, because everything talks through explicit boundaries instead of direct imports.

Over time the pack will evolve — some tools may become optional, others may be added or replaced. What stays constant is the **architecture it enforces**, not the specific brand names.

## What problem it solves

Optimises for long-term maintainability rather than first-day setup speed:

- **Growth ≠ rewrite.** When the business adds a new sub-product, niche, blog, team page, or case-study section — it goes into the same site as another `blocks/domain/<niche>/` + collections + routes. The first site outlives the company's mental model of "what the website is for". No "we need a new website" project every time a business pivots. This is R4 (side-scaling) made explicit.
- New capabilities (forms, dashboards, custom backend services) added by side-scaling, without rewriting the original site.
- Project structure is conventional enough that a new contributor onboards in hours.
- The CMS can be swapped or removed without migrating data — data sits in its own tables behind an access layer.

## Three architectural separations it enforces

1. **Data is separate from UI.** Content lives in clean relational tables (Postgres or SQLite). The frontend never reads the database directly. There is always a layer between them — Payload's API or a custom backend — and that layer speaks through typed contracts.
2. **Logic is separate from the database.** Business logic does not live in queries or in CMS hooks. When a custom backend is needed, it sits in its own workspace (`src/api/`) with repositories on top of the same tables. Swapping the database adapter (SQLite ↔ Postgres) requires no logic changes.
3. **Modules are interchangeable.** Frontend, CMS, future backend — each is a self-contained workspace with its own Dockerfile. They communicate through `contracts/` (shared TypeScript types), never through cross-imports. Pull any one of them out, the others keep working.

This gives a project a clear **growth path**: it can start as a single-CMS landing page and grow into a multi-service system, with the same data layer holding it all up.

## What it isn't

- **Not a visual page builder.** Page composition happens in code (block components); non-developer content edits go through Payload's admin UI.
- **Not a hosting platform.** You bring your own server. Production deploy scripts (blue-green via Docker compose) are included as reference.
- **Not a kitchen-sink CMS.** Payload handles content, media, simple forms, and invariant collections. Domain-specific business logic moves to `src/api/` when the site grows past that.

## Abstraction follows experience (R9)

Shared abstractions enter `packages/` after a pattern has appeared in two or more sites — not in advance. See R9 in [`30-philosophy.md`](30-philosophy.md).

## Where to read next

- [`30-philosophy.md`](30-philosophy.md) — architectural rules R1–R9.
- [`32-structure.md`](32-structure.md) — monorepo and per-site layout, growth models.
- [`35-frontend-stack.md`](35-frontend-stack.md) — frontend stack and the block model.
- [`70-backend-data.md`](70-backend-data.md) — backend and data choices.
- [`90-architecture-diagram.md`](90-architecture-diagram.md) — high-level diagram.
