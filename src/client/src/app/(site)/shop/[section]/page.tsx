import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import {
  applyFilter,
  CATALOG_HREF,
  type Characteristic,
  facetsOf,
  readFilter,
  searchItems,
  shopSettings,
  writeFilter,
} from 'contracts';

import { CardRows } from '@/blocks/arrangements/CardRows';
import { Breadcrumbs } from '@/blocks/primitives/Breadcrumbs';
import { FacetPanel } from '@/blocks/primitives/Shop/FacetPanel';
import { OfferCard } from '@/blocks/primitives/Shop/OfferCard';
import {
  getCatalogSection,
  listCatalogSections,
  getSiteSettings,
  listOffers,
} from '@/lib/api-client.engine';

/**
 * Раздел каталога `/shop/<слаг>`: поиск, фильтр по характеристикам и плитка позиций.
 *
 * @remarks
 * Состояние - в адресе (R13): `?material=pvc&thickness=1.2..2&q=клей`. Фильтр и
 * поиск считаются на сервере по позициям раздела: каталоги наших сайтов - сотни
 * позиций, отдельный сервис поиска не нужен (R7, 44-catalog-search.md). Без JS
 * страница работает целиком: значения фильтра - ссылки, диапазон и поиск - формы.
 */
type Params = { section: string };
type Search = Record<string, string | string[] | undefined>;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const section = await getCatalogSection((await params).section);
  if (!section) return {};
  return {
    title: section.title,
    description: section.description ?? undefined,
    alternates: { canonical: `/shop/${section.slug}` },
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const [{ section: slug }, search] = await Promise.all([params, searchParams]);
  const [section, sections] = await Promise.all([getCatalogSection(slug), listCatalogSections()]);
  if (!section) notFound();
  const basePath = `/shop/${section.slug}`;

  // Форма диапазона присылает `ключ.min` и `ключ.max` - приводим к `ключ=от..до`.
  const canonical = rangesFromForm(search, section.characteristics);
  if (canonical !== null) redirect(canonical ? `${basePath}?${canonical}` : basePath);

  const [offers, settings] = await Promise.all([
    listOffers({ section: section.slug }),
    getSiteSettings(),
  ]);
  const query = typeof search['q'] === 'string' ? search['q'].trim().slice(0, 100) : '';
  const state = readFilter(search, section.characteristics);
  const found = query ? searchItems(offers, query) : offers;
  const facets = facetsOf(found, state, section.characteristics);
  const shown = applyFilter(found, state, section.characteristics);
  const cartHref = shopSettings(settings?.shop).cartHref;

  return (
    <section className="block-space bg-bg">
      <div className="mx-auto max-w-wide px-4 md:px-6">
        <Breadcrumbs
          items={[
            { label: 'Главная', href: '/' },
            // При одном разделе /shop сразу ведёт сюда же - ступень была бы петлёй.
            ...(sections.length > 1
              ? [{ label: shopSettings(settings?.shop).menuTitle, href: CATALOG_HREF }]
              : []),
            { label: section.title },
          ]}
        />
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">
          {section.title}
        </h1>
        {section.description && <p className="mt-2 text-muted">{section.description}</p>}

        <form method="get" action={basePath} role="search" className="mt-6 flex max-w-xl gap-2">
          {[...new URLSearchParams(writeFilter(state, section.characteristics))].map(
            ([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ),
          )}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Поиск в разделе"
            aria-label="Поиск в разделе"
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-fg hover:opacity-90"
          >
            Найти
          </button>
        </form>

        <div className="mt-6 grid gap-8 md:grid-cols-[16rem_minmax(0,1fr)]">
          <aside data-part="filter">
            {/* На телефоне фильтр свёрнут: плитка важнее, чем полстраницы галочек.
                Флажок вместо второй копии панели - она одна на обе ширины. */}
            <input id="facets-open" type="checkbox" className="peer sr-only" />
            <label
              htmlFor="facets-open"
              className="block cursor-pointer font-medium text-ink peer-focus-visible:underline md:hidden"
            >
              Фильтры
            </label>
            <div className="mt-4 hidden peer-checked:block md:mt-0 md:block">
              <FacetPanel
                basePath={basePath}
                facets={facets}
                state={state}
                characteristics={section.characteristics}
                query={query}
              />
            </div>
          </aside>

          <div>
            <p data-part="result-count" className="mb-4 text-sm text-muted">
              {shown.length > 0
                ? `Найдено: ${shown.length}`
                : 'Ничего не нашлось - смягчите фильтр или запрос.'}
            </p>
            {shown.length > 0 && (
              <CardRows as="ul" items={shown} columns={3} gap="md" keepColumns>
                {(offer) => <OfferCard offer={offer} cartHref={cartHref} />}
              </CardRows>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Поля формы диапазона в адрес фильтра.
 *
 * @returns строку канонического адреса, если в запросе были поля формы;
 *   null - запрос уже канонический, переадресация не нужна.
 */
export function rangesFromForm(
  search: Search,
  characteristics: readonly Characteristic[],
): string | null {
  const keys = Object.keys(search);
  if (!keys.some((k) => /\.(min|max)$/.test(k))) return null;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(search)) {
    if (typeof v !== 'string' || /\.(min|max)$/.test(k)) continue;
    params.set(k, v);
  }
  for (const c of characteristics) {
    const min = search[`${c.key}.min`];
    const max = search[`${c.key}.max`];
    const lo = typeof min === 'string' ? min.trim() : '';
    const hi = typeof max === 'string' ? max.trim() : '';
    if (lo || hi) params.set(c.key, `${lo}..${hi}`);
    else if (keys.includes(`${c.key}.min`)) params.delete(c.key);
  }
  return params.toString();
}
