# domain/kennel — питомники

Блоки для сайтов питомников / клубов / РКФ-каталога.

## Подкаталоги

- `dogs/` — карточки собак, профиль (компактный/полный), drawer-модалка, бейджи титулов
- `litter/` — карточки помётов, страница помёта, карточка пары родителей, grid щенков
- `catalog/` — поиск по РКФ-каталогу, suggest-dropdown, фильтры

## Контракты

Соответствующие типы — в `contracts/kennel/{dogs,litters,pedigree,rkf}.ts`.

## Зависимости

- Берёт примитивы из `blocks/primitives/` (Carousel, PedigreeTree, DetailDrawer, ...)
- Берёт декор из `blocks/decor/` (ContentFrame)
- Никогда не зависит от `domain/<other-niche>/`

## Инстанс veo55

Реальные veo55-kennel компоненты (питомник «Омская Дружина») живут в приватном репо `Vovanda/veo55-site` (НЕ в template). Template содержит только пустой каркас как образец организации domain-папки.
