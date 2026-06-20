import Link from 'next/link';
import type { DogDoc, LitterDoc } from '@veo55/contracts';

import { ContentFrame } from '@/blocks/decor/ContentFrame';

/**
 * LittersList — список помётов с фильтром по диапазону `dob` (год / месяц /
 * день / все). Рендерится на маршруте `/puppies[/<year-or-month-or-day>]`.
 *
 * Каждая строка: пара родителей × дата × литера, ссылка на детальную
 * `/puppies/<dob>/<letter>`.
 */
export function LittersList({ litters }: { readonly litters: readonly LitterDoc[] }) {
  return (
    <section className="bg-bg pt-12 md:pt-16 pb-12 md:pb-16">
      <ContentFrame side="none" className="px-6">
        <h1 className="font-display text-3xl md:text-h2 font-semibold text-ink text-center">
          Помёты
        </h1>
        <div className="mx-auto mt-4 mb-10 h-[1.5px] w-16 bg-accent opacity-85 rounded-full" />

        {litters.length === 0 ? (
          <p className="text-center text-muted font-display italic">Пока ничего не найдено.</p>
        ) : (
          <ul className="space-y-4">
            {litters.map((litter) => {
              const dob = litter.dob.slice(0, 10);
              const href = `/puppies/${dob}/${litter.letter}`;
              return (
                <li key={litter.id}>
                  <Link
                    href={href}
                    className="
                      block rounded-[14px] border border-border bg-surface
                      px-6 py-5 transition-all duration-200
                      hover:border-accent hover:shadow-[0_6px_18px_rgba(43,34,26,0.08)]
                      hover:-translate-y-0.5
                    "
                  >
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-display font-bold text-lg uppercase tracking-[0.4px] text-accent">
                        Литера «{letterLabel(litter.letter)}»
                      </span>
                      <span className="font-display italic text-muted">·</span>
                      <span className="font-display italic text-ink">{formatDate(dob)}</span>
                    </div>
                    <p className="mt-2 font-sans text-ink/85">
                      <ParentName dog={litter.father} role="Отец" />
                      <span aria-hidden className="text-accent mx-2 font-display">
                        ×
                      </span>
                      <ParentName dog={litter.mother} role="Мать" />
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </ContentFrame>
    </section>
  );
}

function ParentName({
  dog,
  role,
}: {
  readonly dog: string | DogDoc;
  readonly role: 'Отец' | 'Мать';
}) {
  const name = typeof dog === 'object' ? dog.name : `[${role}]`;
  return <span className="font-bold uppercase tracking-[0.1px]">{name}</span>;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Translit → русская буква для подписи (`n` → `Н`). */
function letterLabel(letter: string): string {
  const map: Record<string, string> = {
    a: 'А',
    b: 'Б',
    v: 'В',
    g: 'Г',
    d: 'Д',
    e: 'Е',
    yo: 'Ё',
    zh: 'Ж',
    z: 'З',
    i: 'И',
    y: 'Й',
    k: 'К',
    l: 'Л',
    m: 'М',
    n: 'Н',
    o: 'О',
    p: 'П',
    r: 'Р',
    s: 'С',
    t: 'Т',
    u: 'У',
    f: 'Ф',
    h: 'Х',
    ts: 'Ц',
    ch: 'Ч',
    sh: 'Ш',
    sch: 'Щ',
    eh: 'Э',
    yu: 'Ю',
    ya: 'Я',
  };
  return map[letter] ?? letter.toUpperCase();
}
