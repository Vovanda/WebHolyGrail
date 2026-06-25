# Invariant collections

Collections inherited by every site. See [`docs/whg/38-invariants.md`](../../../../../docs/whg/38-invariants.md).

| Collection        | Purpose                                                                      |
| ----------------- | ---------------------------------------------------------------------------- |
| `Pages`           | Pages composed from blocks. `title`, `slug`, `blocks[]`, `seo`, `published`. |
| `Media`           | Uploaded files → S3. `file`, `alt`, `sizes`.                                 |
| `Users`           | CMS editors (admin domain). `email`, `role`, `name`.                         |
| `FormSubmissions` | Submissions from public forms. `formType`, `payload`, `createdAt`, `status`. |
| `ReusableBlocks`  | Block fragments referenced from multiple pages.                              |

End-customer entities (`Customers`, `Patients`, `Members`, etc.) are **not** invariant — they live per niche, in `src/api/` once the site grows past model 1. See [`docs/whg/32-structure.md`](../../../../../docs/whg/32-structure.md).

## Extraction status

These files are copies of the corresponding files in `sites/veo55/src/cms/src/collections/`. The copies still reference veo55-specific block imports inside `Pages.blocks[]` and need to be reduced to the invariant subset (`Hero`, `RichText`, `Image`, `Gallery`, `CTA`, `Form`, `Contacts`, `Features`, `FAQ`).

Tracked under template-extract in PLAN.
