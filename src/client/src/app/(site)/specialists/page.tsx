import type { Metadata } from 'next';
import Link from 'next/link';

import { listCities, listSpecialists, type CityDoc, type SpecialistDoc } from '@/lib/api-client';

import { CatalogFilters } from '@/blocks/primitives/CatalogFilters';

/**
 * /specialists — полный список специалистов с фильтром по городу.
 *
 * @remarks
 * Витрина на главной показывает несколько человек или города, а весь список
 * живёт здесь: сюда ведут ссылки «все специалисты» и карточки городов.
 *
 * Фильтр — обычные ссылки с параметром в адресе, а не выпадающий список на
 * клиенте. Так состояние фильтра видно в адресной строке: им можно поделиться,
 * его находит поиск, и он работает без JS (R14).
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Эксперты',
  description: 'Эксперты сообщества: выберите город и направление.',
};

type Search = { city?: string; skill?: string };

function photoUrl(doc: SpecialistDoc): string | undefined {
  const photo = doc.photo;
  if (!photo || typeof photo !== 'object') return undefined;
  return (photo as { url?: string }).url;
}

function cityIdOf(doc: SpecialistDoc): string | null {
  const city = doc.city;
  if (!city) return null;
  if (typeof city === 'object') return String((city as CityDoc).id);
  return String(city);
}

function Card({ doc }: { readonly doc: SpecialistDoc }) {
  const url = photoUrl(doc);
  const disciplines = (doc.disciplines ?? []).map((d) => d.title).filter(Boolean);
  return (
    <Link href={doc.slug ? `/s/${doc.slug}` : '#'} className="no-underline">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
          <img src={url} alt={doc.fullName} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full bg-accent-soft" aria-hidden="true" />
        )}
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h2 className="font-display text-lg font-semibold text-ink">{doc.fullName}</h2>
          {doc.headline && <p className="text-sm text-muted">{doc.headline}</p>}
          {disciplines.length > 0 && (
            <p className="mt-2 text-sm text-ink/80">{disciplines.join(' · ')}</p>
          )}
        </div>
      </article>
    </Link>
  );
}

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { city: citySlug, skill } = await searchParams;

  const [cities, everyone] = await Promise.all([listCities(), listSpecialists({ limit: 200 })]);

  const activeCity = citySlug ? cities.find((c) => c.slug === citySlug) : undefined;

  // Направления собираем из самих карточек: отдельного справочника нет и не
  // нужно — список тем растёт вместе с людьми, а не заводится заранее.
  const skills = [
    ...new Set(everyone.flatMap((d) => (d.disciplines ?? []).map((x) => x.title).filter(Boolean))),
  ].sort((a, b) => a!.localeCompare(b!, 'ru')) as string[];

  const people = everyone
    .filter((doc) => (activeCity ? cityIdOf(doc) === String(activeCity.id) : true))
    .filter((doc) => (skill ? (doc.disciplines ?? []).some((d) => d.title === skill) : true));

  return (
    <div className="mx-auto max-w-wide px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Эксперты</h1>
        <p className="mt-2 text-muted">
          {activeCity ? activeCity.name : 'Все города'} · {skill ?? 'все направления'}
        </p>
      </header>

      <CatalogFilters
        cities={cities.map((c) => ({ slug: c.slug ?? '', name: c.name }))}
        skills={skills}
      />

      {people.length === 0 ? (
        <p className="text-muted">
          Здесь пока никого нет. Попробуйте другой город или загляните позже.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((doc) => (
            <Card key={String(doc.id)} doc={doc} />
          ))}
        </div>
      )}
    </div>
  );
}
