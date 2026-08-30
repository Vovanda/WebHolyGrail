import type { BlockNode, SiteSettings } from 'contracts';

import type { SpecialistDoc } from '@/lib/api-client';

/**
 * SpecialistProfile — рассказ о себе, регалии, факты и адреса из карточки.
 *
 * @remarks
 * Server-only (R14): статичная разметка без состояния.
 *
 * Данные приходят из карточки специалиста, а не из полей блока: человек
 * заполняет их один раз во вкладке «Профиль», а блок отвечает только за место
 * на странице. Раньше секции рисовались из кода и всегда оказывались в самом
 * низу — поднять рассказ о себе выше услуг было нельзя.
 *
 * Пустые секции не рисуются: у того, кто заполнил только био, страница не
 * обрастает пустыми заголовками.
 */
export type ProfileSection = 'bio' | 'credentials' | 'facts' | 'locations';

export interface SpecialistProfileData {
  readonly heading?: string;
  readonly show?: readonly ProfileSection[];
  /** Карточка специалиста — подмешивается страницей при рендере блока. */
  readonly doc?: SpecialistDoc;
}

const ALL: readonly ProfileSection[] = ['bio', 'credentials', 'facts', 'locations'];

export function SpecialistProfile({
  node,
}: {
  readonly node: BlockNode & { data?: SpecialistProfileData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  const doc = data.doc;
  if (!doc) return null;

  const show = new Set(data.show?.length ? data.show : ALL);
  const credentials = doc.credentials ?? [];
  const facts = doc.facts ?? [];
  const locations = doc.locations ?? [];

  const hasBio = show.has('bio') && Boolean(doc.bio);
  const hasCredentials = show.has('credentials') && credentials.length > 0;
  const hasFacts = show.has('facts') && facts.length > 0;
  const hasLocations = show.has('locations') && locations.length > 0;

  if (!hasBio && !hasCredentials && !hasFacts && !hasLocations) return null;

  return (
    <section className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-content px-4 md:px-6">
        {data.heading && (
          <h2
            data-part="title"
            className="mb-6 font-display text-2xl font-semibold text-ink md:text-3xl"
          >
            {data.heading}
          </h2>
        )}

        {hasBio && (
          <div>
            {!data.heading && (
              <h2 data-part="group-title" className="font-display text-xl font-semibold text-ink">
                О себе
              </h2>
            )}
            {doc.bio!.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mt-3 leading-relaxed text-ink/90">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        {hasCredentials && (
          <div className="mt-8">
            <h2 data-part="group-title" className="font-display text-xl font-semibold text-ink">
              Образование и регалии
            </h2>
            <ul className="mt-3 space-y-2">
              {credentials.map((item) => (
                <li key={item.title} data-part="item" className="text-ink/90">
                  {item.title}
                  {item.note && <span className="text-muted"> — {item.note}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasFacts && (
          <div className="mt-8">
            <h2 data-part="group-title" className="font-display text-xl font-semibold text-ink">
              Факты
            </h2>
            <ul className="mt-3 space-y-2">
              {facts.map((item) => (
                <li key={item.text} data-part="item" className="text-ink/90">
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasLocations && (
          <div className="mt-8">
            <h2 data-part="group-title" className="font-display text-xl font-semibold text-ink">
              Где найти
            </h2>
            <ul className="mt-3 space-y-3">
              {locations.map((place) => (
                <li
                  key={place.title}
                  data-part="item"
                  className="rounded-lg border border-border p-4"
                >
                  <p data-part="item-title" className="font-medium text-ink">
                    {place.title}
                  </p>
                  {place.address && (
                    <p data-part="item-body" className="text-muted">
                      {place.address}
                    </p>
                  )}
                  {place.note && <p className="text-sm text-muted">{place.note}</p>}
                  {place.mapUrl && (
                    <a
                      href={place.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-part="action"
                      className="mt-1 inline-block text-sm text-accent underline-offset-2 hover:underline"
                    >
                      Посмотреть на карте
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
