# Invariant data and blocks

> Patterns that recur in almost every site live in `packages/_template` and the shared library, not re-created per site.

## Three layers of data

1. **Invariant** — present in almost every site, shipped in `_template`.
2. **Niche** — depends on the sector, comes from a niche package.
3. **Unique** — written for one site; if a pattern repeats, it graduates into the shared library.

## Invariant collections

Shipped in the template:

- **Pages** — pages built from blocks. Fields: `title`, `slug`, `blocks[]`, `seo`, `published`.
- **Media** — uploaded files (images, documents) → S3. Fields: `file`, `alt`, `sizes`.
- **Users** — CMS editors (the admin domain). People who log into the admin UI and edit content. Lives in `cms/`. Fields: `email`, `role` (`admin` / `editor`), `name`.
- **FormSubmissions** — submissions from public forms. Fields: `formType`, `payload` (JSON), `createdAt`, `status`, `source`.
- **Globals** — singleton site settings: contacts, social links, logo, header/footer, legal details.
- **Navigation / Menu** — menu structure. Frequently invariant.
- **Redirects** — old URL → new URL, for SEO continuity during migrations.

## Invariant fields

- **SEO** — meta title, description, OG image. Attached to every Page.
- **Slug** — URL slug derived from title.
- **Timestamps** — `createdAt` / `updatedAt`. Payload provides them.
- **Publish status** — `draft` / `published`.
- **Audit** — author / last editor.

## Invariant blocks

`Hero` (heading + subheading + CTA + background), `RichText`, `Image` / `Gallery`, `CTA`, `Form`, `Contacts` (address / phone / map), `Features` / `Services` grid, `FAQ`, footer content.

## Users vs. end-customer entity

Two separate domains of people; do not merge them:

- **Users = CMS editors.** People who manage the site from the inside. Invariant. Owned by `cms/`. Always one name.
- **End customers** (the people the business exists for) are **not** invariant — they appear when the site grows past model 1 (see [`32-structure.md`](32-structure.md)). Owned by `api/`, not by the CMS.

These do not overlap: a coffee-shop owner editing the menu through the admin UI (a User) and a guest who booked a table (an end customer) are different people in different systems.

### End-customer entity is named by domain

There is no universal name (no `CrmUsers`, no `Clients`). The name comes from the business:

- shop → **Customers**;
- clinic → **Patients**;
- membership site → **Members**;
- booking service → **Bookings** with associated holders.

Rule: **`Users` is invariant (CMS editors, one name across sites); the end-customer entity is named after the niche.**

## Niche packages (not invariant)

Examples by sector:

- **auto-service** — `ServiceBookings`, `LabourPricing`, `Services`;
- **coffee shop** — `Menu`, `TableReservations`;
- **shop** — `Products`, `Cart`, `Orders`.

## Composition formula

**A new site = invariants (already in `_template`) + niche set + unique pieces.**

Consequence: the analysis "which pages and entities does this site need" applies only to the niche and unique layers. Pages, Media, Users, and basic forms are inherited from the template and require no decision.
