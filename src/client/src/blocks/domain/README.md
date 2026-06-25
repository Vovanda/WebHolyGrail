# L4 — domain blocks

Бизнес-специфичные блоки, заточенные под конкретную нишу. Один подкаталог = одна ниша.

Текущие ниши-примеры:

- `kennel/` — питомники (Dogs, Litters, Puppies, родословные, каталог собак)

Будущие (создавайте по нужде):

- `clinic/` — клиника (Patients, Appointments)
- `cafe/` — кофейня (Menu, Reservations)
- `auto/` — автосервис (Vehicles, ServiceRequests)
- `school/` — обучение (Courses, Students)

## Правила

1. **Generic не зависит от domain.** Если блок в `primitives/`, `layout/`, `decor/` импортирует из `domain/` — это баг.
2. **Domain зависит от generic.** Domain-блок собирается из `primitives/` + добавляет niche-логику.
3. **Контракты domain** живут в `contracts/<niche>/` (например `contracts/kennel/dogs.ts`).
4. **Именование** — функциональное, без жаргона ниши там где можно: `EntityCard` лучше `DogCard`, если визуально та же карточка с фото+заголовком+meta. Если же логика уникальна (родословная, ID питомника) — keep domain name.
5. **Появилось 2+ ниши с похожим блоком** → выделить generic в `primitives/`, поверх — niche-thin-wrappers. R9 — обобщение снизу вверх.
