import type { RkfSearchItem } from '@veo55/contracts';

import { cn } from '@/lib/utils';

/**
 * CatalogSearchResults — список собак на странице `/catalog?name=X` (одна
 * страница ~40 шт по РКФ-сессии).
 *
 * @remarks
 * **Server Component (R14).** Без onClick, без state — просто grid 2x.
 *
 * Дизайн 1:1 с legacy `.vcat-list`/`.vcat-card`/`.vcat-pager`. Аватарки
 * подтягиваем напрямую с РКФ (`showphoto.php?id=N&n=0&s=80`) — fallback на
 * букву-инициал реализован через onError-handler в legacy; у нас Server-only,
 * поэтому просто bg-cream + placeholder-эмодзи.
 */
export interface CatalogSearchResultsProps {
  readonly query: string;
  readonly page: number;
  readonly hasMore: boolean;
  readonly items: ReadonlyArray<RkfSearchItem>;
}

export function CatalogSearchResults({ query, page, hasMore, items }: CatalogSearchResultsProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 px-4 text-muted">
        <strong className="block text-ink text-[17px] font-bold mb-1.5">Ничего не найдено</strong>
        По запросу «{query}» в РКФ-каталоге нет совпадений. Попробуйте написать кличку точнее или
        поищите по части имени.
      </div>
    );
  }

  return (
    <>
      <p className="text-center text-muted text-[14px] mb-3.5">
        По запросу «<b className="text-ink">{query}</b>» — страница{' '}
        <b className="text-ink">{page}</b>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <a
            key={it.id}
            href={`/catalog?dog=${it.id}`}
            className={cn(
              'flex items-center gap-3.5 p-3.5 bg-paper',
              'border border-[#E5DCC9] rounded-md no-underline text-ink',
              'transition-colors transition-shadow duration-120',
              'hover:bg-[#F0E8D6] hover:border-[#CFC8C2] hover:shadow-[0_3px_10px_rgba(28,28,33,0.06)]',
            )}
          >
            <span className="w-16 h-16 rounded-full bg-[#F3EFE7] shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src={`https://www.veorkf.ru/catalog/showphoto.php?id=${it.id}&n=0&s=80`}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </span>
            <span className="min-w-0 flex-1 flex flex-col gap-1.5">
              <span className="font-bold text-ink text-[14px] uppercase tracking-[0.2px] leading-tight break-words">
                {it.name}
              </span>
              {it.birth && (
                <span className="text-muted text-[12.5px] leading-[1.2]">{it.birth}</span>
              )}
            </span>
          </a>
        ))}
      </div>

      <Pager query={query} page={page} hasMore={hasMore} />
    </>
  );
}

function Pager({
  query,
  page,
  hasMore,
}: {
  readonly query: string;
  readonly page: number;
  readonly hasMore: boolean;
}) {
  if (page === 1 && !hasMore) return null;
  const qEnc = encodeURIComponent(query);
  return (
    <nav className="flex flex-wrap gap-1.5 justify-center items-center mt-6" aria-label="Страницы">
      {page > 1 ? (
        <a href={`/catalog?name=${qEnc}&p=${page - 1}`} className={pagerBtnCls}>
          ‹ Назад
        </a>
      ) : (
        <span className={cn(pagerBtnCls, pagerBtnDisabledCls)}>‹ Назад</span>
      )}
      <span className="inline-flex items-center px-3.5 text-muted text-[13px] font-semibold">
        Страница {page}
      </span>
      {hasMore ? (
        <a href={`/catalog?name=${qEnc}&p=${page + 1}`} className={pagerBtnCls}>
          Вперёд ›
        </a>
      ) : (
        <span className={cn(pagerBtnCls, pagerBtnDisabledCls)}>Вперёд ›</span>
      )}
    </nav>
  );
}

const pagerBtnCls = cn(
  'inline-flex items-center justify-center min-h-[38px] px-4',
  'text-[13.5px] font-semibold text-ink no-underline',
  'bg-paper border border-[#E5DCC9] rounded-md',
  'transition-colors duration-120',
  'hover:bg-[#F0E8D6] hover:border-[#CFC8C2]',
);
const pagerBtnDisabledCls = '!text-[#BBB] !bg-[#F6F6F6] !border-[#EEE] cursor-not-allowed';
