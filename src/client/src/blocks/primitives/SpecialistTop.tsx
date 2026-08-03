'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { RatingStars } from './RatingStars';

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
  /** Название города — в карточке оно нужнее списка направлений. */
  readonly cityName?: string;
  /** Показываем, только если владелец карточки открыл оценку. */
  readonly rating?: number;
}

/**
 * Сколько направлений влезает в карточку.
 *
 * @remarks
 * Полный список превращает карточку в простыню и уравнивает всё подряд.
 * Остальное человек увидит на странице специалиста.
 */
const MAX_CARD_SKILLS = 4;

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
  const [skill, setSkill] = useState<string>('');

  // Направления собираем из самих карточек: справочник не нужен, список растёт
  // вместе с людьми.
  const skills = [...new Set(people.flatMap((p) => p.disciplines))].sort((a, b) =>
    a.localeCompare(b, 'ru'),
  );

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

  const shown = people
    .filter((p) => (cityId ? p.cityId === cityId : true))
    .filter((p) => (skill ? p.disciplines.includes(skill) : true))
    .slice(0, limit);

  const select =
    'rounded-md border border-border bg-bg px-3 py-2 text-ink outline-none focus:border-accent';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        {/* Город показываем всегда, когда он вообще есть: даже с одним городом
            фильтр сразу отсекает тех, кто ищет в другом, и показывает, что
            каталог городской. */}
        {withPeople.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            Город
            <select
              className={select}
              value={cityId ?? ''}
              onChange={(e) => setCityId(e.target.value || null)}
            >
              <option value="">Все</option>
              {withPeople.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {/* Направления прячем, пока выбирать нечего: с одним человеком в списке
            фильтр только показывает, что каталог пустой. Появится второй — и
            условие само его вернёт. */}
        {skills.length > 1 && people.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            Направление
            <select className={select} value={skill} onChange={(e) => setSkill(e.target.value)}>
              <option value="">Все</option>
              {skills.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-center text-muted">{emptyText ?? 'Скоро здесь появятся специалисты.'}</p>
      ) : (
        <div
          className={
            // Одна карточка в двухколоночной сетке садится в левую колонку, и
            // половина экрана остаётся пустой — заметнее всего в ландшафте.
            shown.length === 1
              ? 'mx-auto grid max-w-sm gap-4'
              : shown.length === 2
                ? 'mx-auto grid max-w-3xl gap-4 sm:grid-cols-2'
                : 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {shown.map((p) => (
            <Link
              key={p.id}
              href={p.slug ? `/specialists/${p.slug}` : '#'}
              className="no-underline"
            >
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
                  {/* Город — первое, что человек ищет в карточке: он выбирает
                      не только специалиста, но и «дотуда ли я доеду». */}
                  {p.cityName && (
                    <p className="text-sm uppercase tracking-wide text-accent">{p.cityName}</p>
                  )}
                  {typeof p.rating === 'number' && p.rating > 0 && <RatingStars value={p.rating} />}
                  {p.headline && <p className="text-sm text-muted">{p.headline}</p>}
                  {p.disciplines.length > 0 && (
                    <p className="mt-2 text-sm text-ink/80">
                      {p.disciplines.slice(0, MAX_CARD_SKILLS).join(' · ')}
                      {p.disciplines.length > MAX_CARD_SKILLS && ' …'}
                    </p>
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
