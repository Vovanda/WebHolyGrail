import type { RkfDogDoc } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { PedigreeTree } from '@/blocks/primitives/PedigreeTree';

import { CatalogPhotosCarousel } from './CatalogPhotosCarousel';

/**
 * CatalogDogCard — карточка собаки на странице `/catalog?dog=N` (РКФ-прокси).
 *
 * @remarks
 * **Server Component (R14)** — никакого DOM/state. Структура 1:1 с legacy
 * `articles/catalog.html` `.vcat-dog`: имя → лат-имя → фото-карусель → авторы
 * → родители (плашки) → таблица info → дерево родословной → подпись «Данные».
 *
 * **Внутренние ссылки** (отец/мать/предок) → `/catalog?dog=N` (та же страница,
 * прокси-карточка). **Единственная внешняя ссылка** — `veorkf.ru` в подписи
 * «Данные» (требование Володи: одна внешняя ссылка на источник, не россыпь).
 */
export interface CatalogDogCardProps {
  readonly dog: RkfDogDoc;
}

export function CatalogDogCard({ dog }: CatalogDogCardProps) {
  const photoAuthors = Array.from(
    new Set(dog.photos.map((p) => p.author).filter((a): a is string => Boolean(a))),
  );

  return (
    <article className="bg-bg pt-6 pb-12">
      <div className="mx-auto max-w-[880px] px-4 md:px-6">
        <h1 className="text-ink font-bold text-center mb-1 text-[22px] md:text-[26px] tracking-[0.3px] leading-tight">
          {dog.name}
        </h1>
        {dog.nameLat && (
          <p className="text-center text-muted text-[13px] mb-[18px] font-display italic">
            {dog.nameLat}
          </p>
        )}

        <CatalogPhotosCarousel photos={dog.photos} alt={dog.name} />

        {photoAuthors.length > 0 && (
          <p className="text-center text-muted text-[12px] -mt-3 mb-[18px]">
            © Фото: {photoAuthors.join(', ')}
          </p>
        )}

        {(dog.father || dog.mother) && (
          <div className="flex gap-3 flex-wrap mb-6">
            {dog.father && <ParentLink role="Отец" relation={dog.father} />}
            {dog.mother && <ParentLink role="Мать" relation={dog.mother} />}
          </div>
        )}

        {dog.info.length > 0 && (
          <>
            <h2 className="font-display text-ink font-bold mt-6 mb-2.5 pb-1.5 border-b-2 border-[#E5DCC9] text-[18px]">
              Основная информация
            </h2>
            <table className="w-full border-collapse text-[15.5px]">
              <tbody>
                {dog.info.map((f, i) => (
                  <tr key={`${f.label}-${i}`}>
                    <td
                      className={cn(
                        'p-4 border-b border-[#F0EADF] align-middle leading-snug',
                        'w-[38%] text-muted font-display italic font-medium',
                        'text-[20px] md:text-[22px] tracking-[0.3px] leading-[1.1]',
                      )}
                    >
                      {f.label}
                    </td>
                    <td className="p-4 border-b border-[#F0EADF] align-middle leading-snug font-semibold text-ink tracking-[0.2px]">
                      {f.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {dog.pedigree.length > 2 && (
          <>
            <h2 className="font-display text-ink font-bold mt-6 mb-2.5 pb-1.5 border-b-2 border-[#E5DCC9] text-[18px]">
              Родословная
            </h2>
            {/* Без своего title — заголовок уже выше; sourceRkfId покажет
                подпись «Данные: РКФ-каталог» под деревом */}
            <PedigreeTree ancestors={dog.pedigree} sourceRkfId={dog.id} />
          </>
        )}

        {dog.pedigree.length <= 2 && (
          <p className="mt-8 text-center text-[12.5px] font-display italic text-muted">
            Данные:{' '}
            <a
              href={`https://www.veorkf.ru/catalog/dog.php?id=${dog.id}`}
              target="_blank"
              rel="noopener nofollow"
              className="underline decoration-accent underline-offset-[3px]"
            >
              РКФ-каталог ВЕО (veorkf.ru)
            </a>
          </p>
        )}
      </div>
    </article>
  );
}

function ParentLink({
  role,
  relation,
}: {
  readonly role: 'Отец' | 'Мать';
  readonly relation: { readonly id: number; readonly name: string };
}) {
  return (
    <a
      href={`/catalog?dog=${relation.id}`}
      className={cn(
        'flex-1 min-w-[200px] bg-[#FDFBF6] rounded-md',
        'px-[14px] py-3 no-underline border border-[#E5DCC9]',
        'transition-colors duration-150 hover:bg-[#FFF9E8] hover:border-accent',
      )}
    >
      <span className="text-muted text-[11px] uppercase tracking-[0.5px] block">{role}</span>
      <span className="text-ink font-bold uppercase text-[13.5px] mt-0.5 block">
        {relation.name}
      </span>
    </a>
  );
}
