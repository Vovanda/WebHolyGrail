import Link from 'next/link';

import type { BlockNode, SiteSettings } from 'contracts';

import {
  countSpecialistsByCity,
  listCities,
  listSpecialists,
  type CityDoc,
  type SpecialistDoc,
} from '@/lib/api-client';

import { SpecialistTop, type TopCity, type TopPerson } from './SpecialistTop';

/**
 * SpecialistDirectory — каталог людей, сгруппированный по городам.
 *
 * @remarks
 * Server-only (R14): ни фильтров на клиенте, ни лишнего JS. Города —
 * это секции, а не вкладки: с двумя специалистами вкладки прячут половину
 * каталога ради интерактива, которого никто не просил. Когда людей станет
 * много, отсюда вырастет страница города — структура уже готова.
 *
 * Порядок внутри города случайный. Пока специалистов единицы, любой
 * стабильный порядок — это молчаливое «этот главный».
 */
export interface SpecialistDirectoryData {
  readonly view?: 'people' | 'cities' | 'top';
  readonly defaultCity?: { readonly id?: string | number } | string | number | null;
  readonly moreLabel?: string;
  readonly moreHref?: string;
  readonly heading?: string;
  readonly description?: string;
  readonly onlyAccepting?: boolean;
  readonly order?: 'random' | 'ranked' | 'alphabet';
  readonly limit?: number;
  readonly showCities?: boolean;
  readonly emptyText?: string;
}

/**
 * Вес для сортировки: оценка плюс ручная надбавка плюс спрос.
 *
 * @remarks
 * Заявки учитываются с насыщением — сотая заявка не должна весить как первая,
 * иначе один популярный специалист навсегда займёт верх и новым не подняться.
 * Пятьдесят заявок дают максимум два балла, вровень с хорошей оценкой.
 */
function score(doc: SpecialistDoc): number {
  const rating = doc.rating ?? 0;
  const boost = doc.boost ?? 0;
  const demand = Math.min(doc.requestsCount ?? 0, 50) / 25;
  return rating + boost + demand;
}

function cityIdOf(doc: SpecialistDoc): string | null {
  const city = doc.city;
  if (!city) return null;
  if (typeof city === 'object') return String((city as CityDoc).id);
  return String(city);
}

function photoUrl(doc: SpecialistDoc): string | undefined {
  const photo = doc.photo;
  if (!photo || typeof photo !== 'object') return undefined;
  return (photo as { url?: string }).url;
}

/** Тасование Фишера-Йетса: равномерное, в отличие от sort(() => Math.random()). */
function shuffled<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function Card({ doc }: { readonly doc: SpecialistDoc }) {
  const url = photoUrl(doc);
  const href = doc.slug ? `/s/${doc.slug}` : undefined;
  const disciplines = (doc.disciplines ?? []).map((d) => d.title).filter(Boolean);

  const inner = (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- источник — S3 нашей CMS, размеры задаёт контейнер
        <img src={url} alt={doc.fullName} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="aspect-[4/3] w-full bg-accent-soft" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-lg font-semibold text-ink">{doc.fullName}</h3>
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
  );

  return href ? (
    <Link href={href} className="no-underline">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** Заголовок секции и ссылка на полный список — общая шапка обоих режимов. */
function Header({ data }: { readonly data: SpecialistDirectoryData }) {
  return (
    <header className="mb-8 text-center md:mb-10">
      {data.heading && (
        <h2 className="font-display text-h3 font-semibold text-ink md:text-h2">{data.heading}</h2>
      )}
      {data.description && <p className="mt-2 text-muted">{data.description}</p>}
    </header>
  );
}

function MoreLink({ data }: { readonly data: SpecialistDirectoryData }) {
  if (!data.moreLabel || !data.moreHref) return null;
  return (
    <div className="mt-8 text-center">
      <Link
        href={data.moreHref}
        className="inline-block rounded-md border border-accent px-6 py-3 font-medium text-accent transition-colors hover:bg-accent hover:text-accent-fg"
      >
        {data.moreLabel}
      </Link>
    </div>
  );
}

/**
 * Витрина городов: сколько людей в каждом и переход в список этого города.
 * На главной это честнее списка людей — сразу видно географию сообщества.
 */
async function CitiesView({ data }: { readonly data: SpecialistDirectoryData }) {
  const [cities, counts] = await Promise.all([
    listCities(),
    countSpecialistsByCity(data.onlyAccepting ? { onlyAccepting: true } : {}),
  ]);
  const shown = cities.filter((city) => (counts.get(String(city.id)) ?? 0) > 0);

  return (
    <section id="specialists" className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Header data={data} />
        {shown.length === 0 ? (
          <p className="text-center text-muted">
            {data.emptyText ?? 'Скоро здесь появятся специалисты.'}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((city) => {
              const count = counts.get(String(city.id)) ?? 0;
              return (
                <Link
                  key={String(city.id)}
                  href={`${data.moreHref ?? '/specialists'}?city=${city.slug ?? ''}`}
                  className="group rounded-xl border border-border bg-surface p-6 no-underline transition-colors hover:border-accent"
                >
                  <p className="font-display text-xl font-semibold text-ink">{city.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {count} {plural(count, 'специалист', 'специалиста', 'специалистов')}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
        <MoreLink data={data} />
      </div>
    </section>
  );
}

/**
 * Топ с переключателем городов. Отбор и сортировка — здесь, на сервере;
 * клиенту уходит готовый список, он только переключает город.
 */
async function TopView({ data }: { readonly data: SpecialistDirectoryData }) {
  const [cities, everyone] = await Promise.all([
    listCities(),
    listSpecialists({ ...(data.onlyAccepting ? { onlyAccepting: true } : {}), limit: 200 }),
  ]);

  const ranked = [...everyone].sort((a, b) => score(b) - score(a));
  const people: TopPerson[] = ranked.map((doc) => ({
    id: String(doc.id),
    fullName: doc.fullName,
    ...(doc.headline ? { headline: doc.headline } : {}),
    ...(doc.slug ? { slug: doc.slug } : {}),
    ...(photoUrl(doc) ? { photoUrl: photoUrl(doc)! } : {}),
    disciplines: (doc.disciplines ?? []).map((d) => d.title ?? '').filter(Boolean),
    cityId: cityIdOf(doc),
  }));
  const cityList: TopCity[] = cities.map((c) => ({
    id: String(c.id),
    name: c.name,
    ...(c.slug ? { slug: c.slug } : {}),
  }));

  const fallback = data.defaultCity;
  const defaultCityId =
    fallback && typeof fallback === 'object'
      ? String(fallback.id ?? '')
      : fallback
        ? String(fallback)
        : null;

  return (
    <section id="specialists" className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Header data={data} />
        <SpecialistTop
          people={people}
          cities={cityList}
          defaultCityId={defaultCityId}
          limit={data.limit ?? 6}
          moreLabel={data.moreLabel}
          moreHref={data.moreHref}
          emptyText={data.emptyText}
        />
      </div>
    </section>
  );
}

/** Русские окончания: 1 специалист, 2 специалиста, 5 специалистов. */
function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

export async function SpecialistDirectory({
  node,
}: {
  readonly node: BlockNode & { data?: SpecialistDirectoryData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  if (data.view === 'cities') return <CitiesView data={data} />;
  if (data.view === 'top') return <TopView data={data} />;
  const [cities, specialists] = await Promise.all([
    listCities(),
    listSpecialists({
      ...(data.onlyAccepting ? { onlyAccepting: true } : {}),
      limit: data.limit ?? 12,
    }),
  ]);

  const arrange = (items: readonly SpecialistDoc[]) => {
    if (data.order === 'alphabet') {
      return [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
    }
    if (data.order === 'ranked') {
      // Тасуем перед сортировкой: у кого вес одинаковый (а в начале он у всех
      // нулевой), порядок не будет вечно одним и тем же.
      return shuffled(items).sort((a, b) => score(b) - score(a));
    }
    return shuffled(items);
  };

  const byCity = cities
    .map((city) => ({
      city,
      people: arrange(specialists.filter((s) => cityIdOf(s) === String(city.id))),
    }))
    .filter((group) => group.people.length > 0);

  // Люди без города не должны пропадать из каталога — показываем отдельно.
  const noCity = arrange(specialists.filter((s) => cityIdOf(s) === null));

  return (
    <section id="specialists" className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Header data={data} />

        {specialists.length === 0 && (
          <p className="text-center text-muted">
            {data.emptyText ?? 'Скоро здесь появятся специалисты.'}
          </p>
        )}

        {byCity.map(({ city, people }) => (
          <div key={String(city.id)} className="mb-10 last:mb-0">
            {(data.showCities ?? true) && (
              <h3 className="mb-4 font-display text-lg font-semibold uppercase tracking-wide text-accent">
                {city.name}
              </h3>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {people.map((doc) => (
                <Card key={String(doc.id)} doc={doc} />
              ))}
            </div>
          </div>
        ))}

        {noCity.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {noCity.map((doc) => (
              <Card key={String(doc.id)} doc={doc} />
            ))}
          </div>
        )}

        <MoreLink data={data} />
      </div>
    </section>
  );
}
