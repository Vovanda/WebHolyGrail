'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * SpecialistTop — топ специалистов с переключателем городов.
 *
 * @remarks
 * Client-компонент по необходимости (R14): город переключается без перезагрузки,
 * а стартовый выбирается по местоположению посетителя.
 *
 * **Данные приходят с сервера целиком.** Список уже отфильтрован и отсортирован
 * там же — здесь только выбор города. Так переключение мгновенное и не требует
 * похода в CMS на каждый клик.
 *
 * **Как определяется город.** Спрашиваем `/api/geo` — он смотрит на IP и
 * возвращает название города. Разрешение у посетителя не запрашиваем: окно
 * «сайт хочет знать ваше местоположение» на первом экране отпугивает сильнее,
 * чем помогает точность. Не совпало или сервис молчит — показываем город по
 * умолчанию из настроек блока.
 */
export interface TopPerson {
  readonly id: string;
  readonly fullName: string;
  readonly headline?: string;
  readonly slug?: string;
  readonly photoUrl?: string;
  readonly disciplines: readonly string[];
  readonly cityId: string | null;
}

export interface TopCity {
  readonly id: string;
  readonly name: string;
  readonly slug?: string;
}

export function SpecialistTop({
  people,
  cities,
  defaultCityId,
  limit = 6,
  moreLabel,
  moreHref,
  emptyText,
}: {
  readonly people: readonly TopPerson[];
  readonly cities: readonly TopCity[];
  readonly defaultCityId: string | null;
  readonly limit?: number;
  readonly moreLabel?: string | undefined;
  readonly moreHref?: string | undefined;
  readonly emptyText?: string | undefined;
}) {
  const withPeople = cities.filter((c) => people.some((p) => p.cityId === c.id));
  const fallback = defaultCityId ?? withPeople[0]?.id ?? null;
  const [cityId, setCityId] = useState<string | null>(fallback);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/geo');
        if (!res.ok) return;
        const { city } = (await res.json()) as { city?: string };
        if (!city || cancelled) return;
        const match = withPeople.find((c) => c.name.toLowerCase() === city.toLowerCase());
        if (match) setCityId(match.id);
      } catch {
        // Молчим: город по умолчанию уже показан, ошибка геосервиса — не повод
        // ломать секцию.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Список городов приходит с сервера и в рамках страницы не меняется.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shown = people.filter((p) => (cityId ? p.cityId === cityId : true)).slice(0, limit);

  const chip = 'rounded-full border px-4 py-2 text-sm transition-colors';
  const on = 'border-accent bg-accent text-accent-fg';
  const off = 'border-border text-ink hover:border-accent';

  return (
    <>
      {withPeople.length > 1 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {withPeople.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCityId(c.id)}
              className={`${chip} ${cityId === c.id ? on : off}`}
              aria-pressed={cityId === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-center text-muted">{emptyText ?? 'Скоро здесь появятся специалисты.'}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <Link key={p.id} href={p.slug ? `/s/${p.slug}` : '#'} className="no-underline">
              <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- источник S3 нашей CMS
                  <img
                    src={p.photoUrl}
                    alt={p.fullName}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[4/3] w-full bg-accent-soft" aria-hidden="true" />
                )}
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <h3 className="font-display text-lg font-semibold text-ink">{p.fullName}</h3>
                  {p.headline && <p className="text-sm text-muted">{p.headline}</p>}
                  {p.disciplines.length > 0 && (
                    <p className="mt-2 text-sm text-ink/80">{p.disciplines.join(' · ')}</p>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {moreLabel && moreHref && (
        <div className="mt-8 text-center">
          <Link
            href={moreHref}
            className="inline-block rounded-md border border-accent px-6 py-3 font-medium text-accent transition-colors hover:bg-accent hover:text-accent-fg"
          >
            {moreLabel}
          </Link>
        </div>
      )}
    </>
  );
}
