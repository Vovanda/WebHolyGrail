import type { Metadata } from 'next';
import Link from 'next/link';

import { listCities, listSpecialists, type CityDoc, type SpecialistDoc } from '@/lib/api-client';

import { permanentRedirect } from 'next/navigation';

import { CATALOG_RENAMED, catalogPath } from '@/lib/catalog-path';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { CardRows } from '@/blocks/primitives/CardRows';
import { CatalogFilters } from '@/blocks/primitives/CatalogFilters';
import { RatingStars } from '@/blocks/primitives/RatingStars';

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

function Card({ doc, cityName }: { readonly doc: SpecialistDoc; readonly cityName?: string }) {
  const url = photoUrl(doc);
  const disciplines = (doc.disciplines ?? []).map((d) => d.title).filter(Boolean);
  return (
    <Link href={doc.slug ? catalogPath(doc.slug) : '#'} className="no-underline">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
          <img src={url} alt={doc.fullName} className="aspect-[4/3] w-full object-cover" />
        ) : (
          <div className="aspect-[4/3] w-full bg-accent-soft" aria-hidden="true" />
        )}
        <div className="flex flex-1 flex-col gap-1 p-4">
          <h2 className="font-display text-lg font-semibold text-ink">{doc.fullName}</h2>
          {/* Город — первое, что человек ищет в карточке: он выбирает не только
              специалиста, но и «дотуда ли я доеду». */}
          {cityName && <p className="text-sm uppercase tracking-wide text-accent">{cityName}</p>}
          {doc.ratingPublic && typeof doc.rating === 'number' && doc.rating > 0 && (
            <RatingStars value={doc.rating} />
          )}
          {doc.headline && <p className="text-sm text-muted">{doc.headline}</p>}
          {disciplines.length > 0 && (
            <p className="mt-2 text-sm text-ink/80">
              {disciplines.slice(0, 4).join(' · ')}
              {disciplines.length > 4 && ' …'}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

/**
 * Разметка списка: робот видит, что это каталог людей и в каком они порядке.
 * Отдаём только показанных — с учётом фильтров, как и посетителю.
 */
function listJsonLd(people: readonly SpecialistDoc[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: people.length,
    itemListElement: people.map((doc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Person',
        name: doc.fullName,
        ...(doc.slug ? { url: catalogPath(doc.slug) } : {}),
        ...(photoUrl(doc) ? { image: photoUrl(doc) } : {}),
        ...(doc.headline ? { jobTitle: doc.headline } : {}),
      },
    })),
  });
}

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { city: citySlug, skill } = await searchParams;

  // Инстанс переименовал раздел (`эксперты`, `врачи`, `мастера`) — этот адрес
  // остаётся от шаблона и не должен жить вторым каталогом: одинаковый список по
  // двум адресам поисковик считает дублем, а люди расходятся по разным ссылкам.
  if (CATALOG_RENAMED) {
    const query = new URLSearchParams();
    if (citySlug) query.set('city', citySlug);
    if (skill) query.set('skill', skill);
    const qs = query.toString();
    permanentRedirect(qs ? `${catalogPath()}?${qs}` : catalogPath());
  }

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
    <div className="mx-auto max-w-wide px-4 pb-10 md:px-6 md:pb-14">
      {people.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: listJsonLd(people) }}
        />
      )}
      <Breadcrumbs copyLink items={[{ label: 'Главная', href: '/' }, { label: 'Эксперты' }]} />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Эксперты</h1>
        <p className="mt-2 text-muted">
          {activeCity ? activeCity.name : 'Все города'} · {skill ?? 'все направления'}
        </p>
      </header>

      <CatalogFilters
        basePath={catalogPath()}
        cities={cities.map((c) => ({ slug: c.slug ?? '', name: c.name }))}
        // Направления прячем, пока выбирать нечего: с одним человеком в
        // каталоге фильтр только подчёркивает, что он пустой. Появится второй —
        // и список вернётся сам.
        skills={skills.length > 1 && everyone.length > 1 ? skills : []}
      />

      {people.length === 0 ? (
        <p className="text-muted">
          Здесь пока никого нет. Попробуйте другой город или загляните позже.
        </p>
      ) : (
        /* Неполный ряд обёртка ставит по центру сама: прежде здесь стояли
           условия на одну и на две карточки, чтобы они не садились в левую
           колонку и не оставляли половину экрана пустой. */
        <CardRows items={people}>
          {(doc) => {
            const name = cities.find((c) => String(c.id) === cityIdOf(doc))?.name;
            return <Card doc={doc} {...(name ? { cityName: name } : {})} />;
          }}
        </CardRows>
      )}
    </div>
  );
}
