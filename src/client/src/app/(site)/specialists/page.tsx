import type { Metadata } from 'next';
import Link from 'next/link';

import { listCities, listSpecialists, type CityDoc, type SpecialistDoc } from '@/lib/api-client';

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

type Search = { city?: string; skill?: string; all?: string };

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
          {doc.acceptingClients === false && (
            <p className="mt-auto pt-3 text-xs uppercase tracking-wide text-muted">
              Сейчас не набирает
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export default async function SpecialistsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const { city: citySlug, skill, all } = await searchParams;
  const showBusy = all === '1';

  const [cities, everyone] = await Promise.all([
    listCities(),
    listSpecialists({ limit: 200, ...(showBusy ? {} : { onlyAccepting: true }) }),
  ]);

  const activeCity = citySlug ? cities.find((c) => c.slug === citySlug) : undefined;

  // Направления собираем из самих карточек: отдельного справочника нет и не
  // нужно — список тем растёт вместе с людьми, а не заводится заранее.
  const skills = [
    ...new Set(everyone.flatMap((d) => (d.disciplines ?? []).map((x) => x.title).filter(Boolean))),
  ].sort((a, b) => a!.localeCompare(b!, 'ru')) as string[];

  const people = everyone
    .filter((doc) => (activeCity ? cityIdOf(doc) === String(activeCity.id) : true))
    .filter((doc) => (skill ? (doc.disciplines ?? []).some((d) => d.title === skill) : true));

  const chip = 'rounded-full border px-4 py-2 text-sm no-underline transition-colors';
  const chipOn = 'border-accent bg-accent text-accent-fg';
  const chipOff = 'border-border text-ink hover:border-accent';
  /** Собирает адрес фильтра, сохраняя остальные выбранные условия. */
  const link = (next: Partial<Search>) => {
    const params = new URLSearchParams();
    const city = next.city !== undefined ? next.city : citySlug;
    const sk = next.skill !== undefined ? next.skill : skill;
    const busy = next.all !== undefined ? next.all : showBusy ? '1' : '';
    if (city) params.set('city', city);
    if (sk) params.set('skill', sk);
    if (busy) params.set('all', '1');
    const qs = params.toString();
    return qs ? `/specialists?${qs}` : '/specialists';
  };

  return (
    <div className="mx-auto max-w-wide px-4 py-10 md:px-6 md:py-14">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-ink md:text-4xl">Эксперты</h1>
        <p className="mt-2 text-muted">
          {activeCity ? activeCity.name : 'Все города'} · {skill ?? 'все направления'} ·{' '}
          {showBusy ? 'включая занятых' : 'только те, кто берёт новых'}
        </p>
      </header>

      {cities.length > 0 && (
        <nav aria-label="Фильтр по городу" className="mb-6 flex flex-wrap gap-2">
          <Link href={link({ city: '' })} className={`${chip} ${activeCity ? chipOff : chipOn}`}>
            Все города
          </Link>
          {cities.map((c) => (
            <Link
              key={String(c.id)}
              href={link({ city: c.slug ?? '' })}
              className={`${chip} ${activeCity?.id === c.id ? chipOn : chipOff}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      )}

      {skills.length > 0 && (
        <nav aria-label="Фильтр по направлению" className="mb-6 flex flex-wrap gap-2">
          <Link href={link({ skill: '' })} className={`${chip} ${skill ? chipOff : chipOn}`}>
            Все направления
          </Link>
          {skills.map((title) => (
            <Link
              key={title}
              href={link({ skill: title })}
              className={`${chip} ${skill === title ? chipOn : chipOff}`}
            >
              {title}
            </Link>
          ))}
        </nav>
      )}

      <p className="mb-6">
        <Link
          href={link({ all: showBusy ? '' : '1' })}
          className="text-sm text-accent underline-offset-2 hover:underline"
        >
          {showBusy ? 'Показать только тех, кто берёт новых' : 'Показать всех, включая занятых'}
        </Link>
      </p>

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
