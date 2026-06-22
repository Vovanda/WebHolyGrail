import type { DogDoc, RkfDogDoc } from '@veo55/contracts';

import type { DogProfileData } from '@/components/dog/DogProfile';

/**
 * Адаптеры из конкретных доменных типов (наша Dog / RKF Dog) в единый
 * `DogProfileData`, который рисует `<DogProfile>`. См. шапку DogProfile.tsx.
 */

const SEX_LABEL = { male: 'Кобель', female: 'Сука' } as const;
const COLOR_LABEL: Record<string, string> = {
  cheprachny: 'Чепрачный',
  zonarny: 'Зонарный',
  cherny: 'Чёрный',
};

export function rkfDogToProfile(dog: RkfDogDoc): DogProfileData {
  return {
    name: dog.name,
    ...(dog.nameLat !== undefined && { nameLat: dog.nameLat }),
    photos: dog.photos.map((p) => ({
      url: p.url,
      alt: dog.name,
      ...(p.author !== undefined && { author: p.author }),
    })),
    ...(dog.father && { father: { href: `/catalog?dog=${dog.father.id}`, name: dog.father.name } }),
    ...(dog.mother && { mother: { href: `/catalog?dog=${dog.mother.id}`, name: dog.mother.name } }),
    info: dog.info,
    pedigree: dog.pedigree,
    sourceRkfId: dog.id,
    lightboxGroupId: `rkf-${dog.id}`,
  };
}

export function ourDogToProfile(dog: DogDoc): DogProfileData {
  const photos = (dog.photos ?? [])
    .map((p) =>
      typeof p.image === 'object' ? { url: p.image.url, alt: p.image.alt ?? dog.name } : null,
    )
    .filter((p): p is { url: string; alt: string } => p !== null);

  const info: { label: string; value: string }[] = [];
  info.push({ label: 'Пол', value: SEX_LABEL[dog.sex] });
  if (dog.dob) info.push({ label: 'Дата рождения', value: formatDob(dog.dob) });
  if (dog.color) {
    const colorLabel = COLOR_LABEL[dog.color];
    if (colorLabel) info.push({ label: 'Окрас', value: colorLabel });
  }

  const pedigree = dog.pedigree ?? [];
  const father = pedigree.find((a) => a.position === 1);
  const mother = pedigree.find((a) => a.position === 8);

  return {
    name: dog.name,
    photos,
    ...(father && { father: { href: pedigreeHref(father), name: father.name } }),
    ...(mother && { mother: { href: pedigreeHref(mother), name: mother.name } }),
    info,
    pedigree,
    ...(dog.rkfId !== undefined && { sourceRkfId: dog.rkfId }),
    lightboxGroupId: `our-${dog.slug}`,
  };
}

function pedigreeHref(ancestor: { readonly rkfId?: number }): string {
  return ancestor.rkfId ? `/catalog?dog=${ancestor.rkfId}` : '#';
}

function formatDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}
