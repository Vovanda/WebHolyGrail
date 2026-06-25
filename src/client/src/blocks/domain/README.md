# L4 — domain blocks

Business-specific blocks tailored to a concrete niche. One sub-directory = one niche.

The template ships this directory **empty** — domain blocks belong to the instance, not to upstream.

Example niches (create as needed when you build an instance):

- `clinic/` — clinics (Patients, Appointments)
- `cafe/` — cafe (Menu, Reservations)
- `auto/` — car service (Vehicles, ServiceRequests)
- `school/` — courses (Courses, Students)
- `blog/` — blog (Posts, Comments)
- `kennel/` — kennels (Dogs, Litters, …)

## Rules

1. **Generic does not depend on domain.** If a block in `primitives/`, `layout/`, `decor/` imports from `domain/` — it's a bug.
2. **Domain depends on generic.** A domain block is composed from `primitives/` and adds niche-specific logic.
3. **Domain contracts** live in `contracts/<niche>/` (e.g. `contracts/clinic/patients.ts`).
4. **Naming** is functional, avoid niche jargon where you can: `EntityCard` is better than `PatientCard` if it's visually the same card with photo + heading + meta. Only keep the domain name when the logic is genuinely unique (a medical chart, a pedigree tree, etc.).
5. **Two or more niches grow a similar block** → extract the generic version into `primitives/`, keep niche-thin-wrappers on top. R9 — generalise bottom-up.
