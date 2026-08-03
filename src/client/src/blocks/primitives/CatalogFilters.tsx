'use client';

import { useRouter, useSearchParams } from 'next/navigation';

/**
 * CatalogFilters — компактные фильтры каталога: город и направление.
 *
 * @remarks
 * Client-компонент по необходимости (R14): выбор в списке сразу меняет выдачу,
 * без кнопки «показать» и лишнего шага.
 *
 * Выпадающие списки, а не россыпь кнопок: направлений со временем станет
 * десятки, и они займут пол-экрана раньше, чем первая карточка.
 *
 * Состояние остаётся в адресе — ссылкой на «пилатес в Омске» можно поделиться,
 * и она открывается сразу отфильтрованной.
 */
export function CatalogFilters({
  cities,
  skills,
  basePath,
}: {
  readonly cities: ReadonlyArray<{ readonly slug: string; readonly name: string }>;
  readonly skills: readonly string[];
  /**
   * Адрес раздела каталога. Приходит пропом с сервера, а не из окружения:
   * `NEXT_PUBLIC_*` вшивается в бандл на сборке, а сегмент задаётся инстансом
   * при развёртывании — в клиентском коде значение застыло бы навсегда.
   */
  readonly basePath: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const city = params.get('city') ?? '';
  const skill = params.get('skill') ?? '';

  function apply(next: { city?: string; skill?: string }) {
    const query = new URLSearchParams();
    const nextCity = next.city !== undefined ? next.city : city;
    const nextSkill = next.skill !== undefined ? next.skill : skill;
    if (nextCity) query.set('city', nextCity);
    if (nextSkill) query.set('skill', nextSkill);
    const qs = query.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const select =
    'rounded-md border border-border bg-bg px-3 py-2 text-ink outline-none focus:border-accent';

  return (
    <div className="mb-8 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        Город
        <select className={select} value={city} onChange={(e) => apply({ city: e.target.value })}>
          <option value="">Все</option>
          {cities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* Пустой список направлений — сигнал скрыть фильтр целиком: выбирать
          в нём нечего, а место он занимает. */}
      {skills.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-muted">
          Направление
          <select
            className={select}
            value={skill}
            onChange={(e) => apply({ skill: e.target.value })}
          >
            <option value="">Все</option>
            {skills.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      )}

      {(city || skill) && (
        <button
          type="button"
          onClick={() => apply({ city: '', skill: '' })}
          className="text-sm text-accent underline-offset-2 hover:underline"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
