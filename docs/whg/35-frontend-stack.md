# Frontend stack

> Presentation layer. Layout rules R1–R2, R5, R6 are in [`30-philosophy.md`](30-philosophy.md).

## Stack

- **React + Next.js** — framework. SSR, file-based routing, SEO out of the box. Native platform for shadcn.
- **shadcn/ui** — component base. Copied into the project (the code is yours). Under the hood: Radix — accessibility primitives.
- **Tailwind** — styling. Utilities are encapsulated inside components (R1).
- **CSS variables (tokens)** — single source of design tokens. Wired from day one.
- **CSS Grid + Flexbox** — layout engine. Drives the block grid below.
- **CVA (class-variance-authority)** — component variants (`variant`, `size`), introduced when variants actually appear.

The set is intentionally closed. New tools are added only when there is a concrete need.

## Block model

UI composes as a tree of rectangular blocks on a grid. A grid + a catalogue of blocks + a reordering mechanism covers the majority of typical small-business UIs without requiring a generic visual builder.

### Recursion

Blocks nest at any depth: grid inside grid is a legitimate primitive. A page is a list of blocks; a block may contain blocks; section → columns → cards → inputs — all blocks on nested grids.

### Two kinds of blocks (do not mix)

- **Layout blocks** (`Grid`, `Stack`, `Columns`) — pure layout. Hold no data of their own, only children.
- **Content blocks** (`Hero`, `Card`, `Input`, `Image`) — leaves of the tree. Render data.

This separation matters: without it, layout and content become entangled and the structure cannot be reorganised without touching the content.

### Block discipline (R5 applied)

**A block is a pure function of its props at every nesting level.** It does not know where it sits, does not reach for its parent, does not fetch data on its own — it receives props, renders children. Recursion stays manageable.

### Depth boundary is semantic, not technical

Nesting is technically unbounded. In practice, a non-developer editor in the CMS should not be assembling five-level nested structures by hand. A complex nested structure is wrapped into a single ready-made block (`<Card>` with its own inner grid is exposed as one "Card" entry to the editor). Developers think recursively; editors operate on a flat list.

## How the model connects

One mechanism, three uses:

- **Frontend** — a page renders from a tree of blocks.
- **CMS** (Payload blocks) — an editor reorders blocks because a page is an ordered list of blocks.
- **Component library** — a growing catalogue of blocks shared across sites.
