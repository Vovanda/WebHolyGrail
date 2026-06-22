import type { PedigreeAncestor } from '@veo55/contracts';

import { cn } from '@/lib/utils';
import { Carousel } from '@/blocks/primitives/Carousel';
import { PedigreeTree } from '@/blocks/primitives/PedigreeTree';

/**
 * DogProfile — единый layout карточки собаки.
 *
 * Используется и для наших Dog (`/dog/<slug>`), и для proxy-RKF
 * (`/catalog?dog=N`). Структура 1:1 с legacy `articles/catalog.html`
 * `.vcat-dog`: имя → лат-имя → фото-карусель → авторы → родители → info →
 * (опц. extras) → pedigree.
 *
 * Адаптеры из конкретных DogDoc / RkfDogDoc живут в `lib/dog-profile.ts`.
 *
 * Server Component (R14).
 */
export interface DogProfilePhoto {
  readonly url: string;
  readonly alt?: string;
  readonly author?: string;
}

export interface DogProfileRelation {
  readonly href: string;
  readonly name: string;
}

export interface DogProfileInfoField {
  readonly label: string;
  readonly value: string;
}

export interface DogProfileData {
  readonly name: string;
  readonly nameLat?: string;
  readonly photos: ReadonlyArray<DogProfilePhoto>;
  readonly father?: DogProfileRelation;
  readonly mother?: DogProfileRelation;
  readonly info: ReadonlyArray<DogProfileInfoField>;
  readonly pedigree: ReadonlyArray<PedigreeAncestor>;
  /** РКФ-id для подписи «Данные: РКФ-каталог (veorkf.ru)». */
  readonly sourceRkfId?: number;
  /** Идентификатор для группировки лайтбокса (несколько карточек на одной странице). */
  readonly lightboxGroupId: string;
}

export interface DogProfileProps {
  readonly data: DogProfileData;
  /**
   * Дополнительные блоки наших собак (регалии, описание). Рендерится между
   * родителями и таблицей info — место, где у legacy РКФ ничего нет, и где
   * блок добавляет ценность без слома структуры.
   */
  readonly extras?: React.ReactNode;
}

export function DogProfile({ data, extras }: DogProfileProps) {
  const photoAuthors = Array.from(
    new Set(data.photos.map((p) => p.author).filter((a): a is string => Boolean(a))),
  );

  return (
    <article className="bg-bg pt-6 pb-12">
      <div className="mx-auto max-w-[880px] px-4 md:px-6">
        <h1 className="text-ink font-bold text-center mb-1 text-[22px] md:text-[26px] tracking-[0.3px] leading-tight">
          {data.name}
        </h1>
        {data.nameLat && (
          <p className="text-center text-muted text-[13px] mb-[18px] font-display italic">
            {data.nameLat}
          </p>
        )}

        {data.photos.length > 0 && (
          <div className="max-w-[720px] mx-auto mb-6">
            <Carousel
              slides={data.photos.map((p) => ({ url: p.url, alt: p.alt ?? data.name }))}
              interval={6000}
              arrows={data.photos.length > 1}
              swipe
              objectFit="contain"
              height="clamp(300px, 60vw, 520px)"
              background="#F3EFE7"
              rounded="10px"
              lightboxGroupId={data.lightboxGroupId}
            />
          </div>
        )}

        {photoAuthors.length > 0 && (
          <p className="text-center text-muted text-[12px] -mt-3 mb-[18px]">
            © Фото: {photoAuthors.join(', ')}
          </p>
        )}

        {(data.father || data.mother) && (
          <div className="flex gap-3 flex-wrap mb-6">
            {data.father && <ParentLink role="Отец" relation={data.father} />}
            {data.mother && <ParentLink role="Мать" relation={data.mother} />}
          </div>
        )}

        {extras}

        {data.info.length > 0 && (
          <>
            <h2 className="font-display text-ink font-bold mt-6 mb-2.5 pb-1.5 border-b-2 border-[#E5DCC9] text-[18px]">
              Основная информация
            </h2>
            <table className="w-full border-collapse text-[15.5px]">
              <tbody>
                {data.info.map((f, i) => (
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

        {data.pedigree.length > 2 && (
          <>
            <h2 className="font-display text-ink font-bold mt-6 mb-2.5 pb-1.5 border-b-2 border-[#E5DCC9] text-[18px]">
              Родословная
            </h2>
            <PedigreeTree
              ancestors={data.pedigree}
              {...(data.sourceRkfId !== undefined && { sourceRkfId: data.sourceRkfId })}
            />
          </>
        )}

        {data.pedigree.length <= 2 && data.sourceRkfId && (
          <p className="mt-8 text-center text-[12.5px] font-display italic text-muted">
            Данные:{' '}
            <a
              href={`https://www.veorkf.ru/catalog/dog.php?id=${data.sourceRkfId}`}
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
  readonly relation: DogProfileRelation;
}) {
  return (
    <a
      href={relation.href}
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
