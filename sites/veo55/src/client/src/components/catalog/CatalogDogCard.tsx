import type { RkfDogDoc } from '@veo55/contracts';

import { DogProfile } from '@/components/dog/DogProfile';
import { rkfDogToProfile } from '@/lib/dog-profile';

/**
 * CatalogDogCard — карточка собаки на `/catalog?dog=N` (РКФ-прокси).
 *
 * Тонкая обёртка: adapter RkfDog → DogProfileData → `<DogProfile>`. Единый
 * layout с нашими `/dog/<slug>` (см. `components/dog/DogProfile.tsx`).
 */
export function CatalogDogCard({ dog }: { readonly dog: RkfDogDoc }) {
  return <DogProfile data={rkfDogToProfile(dog)} />;
}
