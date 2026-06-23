import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import { getRkfDog, searchRkf } from '@/lib/api-client';
import { CatalogSearchForm } from '@/components/catalog/CatalogSearchForm';
import { CatalogDogCard } from '@/components/catalog/CatalogDogCard';
import { CatalogSearchResults } from '@/components/catalog/CatalogSearchResults';

/**
 * `/catalog` — публичная страница-прокси к РКФ-каталогу `veorkf.ru`.
 *
 * @remarks
 * **Не наш список собак.** Список **наших** живёт на `/dogs` (бывший
 * `/catalog`). Это прокси: ввёл кличку — нашёл в РКФ — получил карточку
 * (включая родословную и ссылки на предков, которые тоже резолвятся через
 * РКФ).
 *
 * **Маршрутизация по `searchParams` (1:1 с legacy `articles/catalog.html`):**
 *  - `?dog=N` / `?id=N` → карточка собаки (`/api/rkf/dog?id=N`)
 *  - `?name=X[&p=N]` / `?q=X` → страница поиска (`/api/rkf/search`)
 *    + автопереход на карточку если single result на первой странице
 *  - без параметров → hero + форма поиска
 *
 * **Server Component (R14).** Forma поиска — отдельный client-island
 * `CatalogSearchForm`.
 *
 * **Кеш.** Сами fetch'и идут через `/api/rkf/*` где включён 7д hard / 1д
 * soft (см. `cms/src/lib/rkf/cache.ts`). На уровне Next включён
 * `revalidate: 3600` — переоткроет через час, чтобы новые фото / даты
 * РКФ подтянулись.
 */

export const dynamic = 'force-dynamic';

interface CatalogSearchParams {
  readonly dog?: string;
  readonly id?: string;
  readonly name?: string;
  readonly q?: string;
  readonly p?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const dogIdStr = params.dog ?? params.id;
  if (dogIdStr) {
    const id = Number(dogIdStr);
    if (Number.isFinite(id)) {
      const result = await getRkfDog(id);
      if (result.status === 'ok') {
        return { title: `${result.dog.name} — РКФ-каталог · Питомник «Омская Дружина»` };
      }
    }
  }
  const query = (params.name ?? params.q ?? '').trim();
  if (query) {
    return { title: `Поиск «${query}» — Каталог РКФ` };
  }
  return { title: 'Каталог собак — РКФ-каталог ВЕО' };
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>;
}) {
  const params = await searchParams;
  const dogIdStr = params.dog ?? params.id;
  const query = (params.name ?? params.q ?? '').trim();
  const page = Math.max(1, Number(params.p) || 1);

  // 1) Прямая ссылка на собаку по id.
  if (dogIdStr) {
    const id = Number(dogIdStr);
    if (!Number.isFinite(id))
      return (
        <CatalogShell>
          <NotFound query={dogIdStr} />
        </CatalogShell>
      );
    const result = await getRkfDog(id);
    if (result.status === 'not-found')
      return (
        <CatalogShell>
          <NotFound query={`id=${id}`} />
        </CatalogShell>
      );
    if (result.status === 'error')
      return (
        <CatalogShell>
          <FetchError id={id} />
        </CatalogShell>
      );
    return (
      <CatalogShell hideSearch>
        <CatalogDogCard dog={result.dog} />
      </CatalogShell>
    );
  }

  // 2) Поиск по имени.
  if (query) {
    const result = await searchRkf(query, page);
    // Single hit на первой странице → сразу карточка (1:1 с legacy `dispatch()`).
    if (result.count === 1 && page === 1 && !result.hasMore && result.items[0]) {
      redirect(`/catalog?dog=${result.items[0].id}`);
    }
    return (
      <CatalogShell initialQuery={query}>
        <CatalogSearchResults
          query={query}
          page={result.page}
          hasMore={result.hasMore}
          items={result.items}
        />
      </CatalogShell>
    );
  }

  // 3) Hero — нет параметров.
  return (
    <CatalogShell>
      <Hero />
    </CatalogShell>
  );
}

function CatalogShell({
  children,
  hideSearch = false,
  initialQuery,
}: {
  readonly children: React.ReactNode;
  readonly hideSearch?: boolean;
  readonly initialQuery?: string;
}) {
  return (
    <div className="bg-bg min-h-screen">
      <div className="mx-auto max-w-[880px] px-4 md:px-6 pt-6 md:pt-8">
        <h1 className="text-center font-bold mb-1 leading-tight tracking-[0.2px] text-[clamp(22px,4vw,30px)]">
          <a href="/catalog" className="text-ink no-underline transition-opacity hover:opacity-75">
            <span className="text-[0.85em] mr-1.5">🐾</span>
            Каталог собак{' '}
            <span className="text-muted font-semibold text-[0.7em]">· РКФ-данные</span>
          </a>
        </h1>

        {!hideSearch &&
          (initialQuery !== undefined ? (
            <CatalogSearchForm initialQuery={initialQuery} />
          ) : (
            <CatalogSearchForm />
          ))}

        {children}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="text-center px-3.5 pt-6 pb-4 text-muted text-[15px] leading-relaxed">
      <p>Введите кличку собаки выше, чтобы найти её карточку и родословную.</p>
      <p className="mt-2">
        Источник данных:{' '}
        <strong className="text-ink font-bold inline-block mt-1">
          РКФ-каталог восточноевропейской овчарки
        </strong>{' '}
        (veorkf.ru).
      </p>
      <p className="mt-2">Все собаки родителей и предков из родословной кликабельны.</p>
    </div>
  );
}

function NotFound({ query }: { readonly query: string }) {
  return (
    <div className="text-center py-12 px-4 text-muted">
      <strong className="block text-ink text-[17px] font-bold mb-1.5">Ничего не найдено</strong>
      По запросу «{query}» в РКФ-каталоге нет совпадений. Попробуйте написать кличку точнее или
      поищите по части имени.
    </div>
  );
}

function FetchError({ id }: { readonly id: number }) {
  return (
    <div className="text-center py-12 px-4 text-muted">
      <strong className="block text-ink text-[17px] font-bold mb-1.5">
        Не удалось загрузить карточку
      </strong>
      РКФ-сервер не ответил вовремя. Обновите страницу через минуту — карточка id={id} должна
      подтянуться.
    </div>
  );
}
