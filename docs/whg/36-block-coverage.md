# Block-model coverage

> Capability map: what the block model provides through Payload out of the box vs. what requires custom work.

## Three composition levels

**Level 1 — section-rows (flat list).**
A page is a vertical list of section-sized blocks: Hero, About, Pricing, Gallery, Form, Footer. The editor reorders them, toggles visibility, edits content inside.

**Level 2 — composite block with built-in structure (assembled by a developer).**
A section contains its own grid: columns, cards, a photo grid. For the editor this is **one ready-made block** — "Service Cards" or "Gallery 3×N" — exposed with a few settings.

**Level 3 — arbitrary recursive composition (grid in grid).**
The editor assembles the tree directly: drops columns into a section, cards into columns, inputs into cards. This is a full visual builder in the spirit of Tilda or Webflow.

## What is covered out of the box (Payload)

**Levels 1 and 2 are fully covered by Payload blocks.**

- The editor reorders sections (drag up/down in the admin UI).
- Sections can be toggled, duplicated.
- Content is edited inside through typed fields (text, price, photo, link).
- Pre-built blocks are picked from a catalogue and added to a page.
- Each block exposes the options the developer defined (e.g. 2 or 3 columns).

This covers the typical small-business content workflow without any custom builder code.

## What requires custom work

**Level 3 is not provided by Payload out of the box.**

Building it means writing:

- a visual canvas with drag-and-drop of blocks into blocks;
- live preview;
- depth and nesting controls in the UI;
- validation to prevent the editor from assembling broken structures.

This is months of work — a separate product on top of the framework, not part of a typical site.

## The boundary

| Level                 | Who composes                           | Payload out of the box | In the framework |
| --------------------- | -------------------------------------- | ---------------------- | ---------------- |
| 1 (section rows)      | editor                                 | ✅ yes                 | ✅               |
| 2 (composite blocks)  | developer assembles, editor configures | ✅ yes                 | ✅               |
| 3 (recursive builder) | editor, visually                       | ❌ no                  | add-on           |

**Rule:** recursion lives in **code** (the developer thinks block-in-block, R5). For the editor it is wrapped into ready-made blocks. The editor works flat.
