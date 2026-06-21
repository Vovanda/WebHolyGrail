import type { LitterDoc, Puppy } from '@veo55/contracts';

import { cn } from '@/lib/utils';

/**
 * LitterAvailabilityCta — лента «🐾 Свободна одна — … + ✉ Написать нам в VK»
 * 1:1 с legacy `.veo-litter-cta`. Кладётся выше заголовка помёта.
 *
 * Логика бейджа:
 *  - ровно 1 свободный → «Свободна одна — <цвет> <пол>» (склонение по полу)
 *  - >1 → «Свободно: N»
 *  - 0 → бейдж скрыт, остаётся только кнопка как универсальный канал связи
 *  - archived помёт → ничего не рендерим (покупать нечего)
 *
 * `vkMeUrl` тянем из `process.env.VK_GROUP_ME_URL` с fallback'ом на наш
 * аккаунт. Дубль c SocialFeedServer — третий случай вынесем в helper (R9).
 */
export function LitterAvailabilityCta({
  status,
  visiblePuppies,
}: {
  readonly status: LitterDoc['status'];
  readonly visiblePuppies: ReadonlyArray<Puppy>;
}) {
  if (status === 'archived') return null;

  const available = visiblePuppies.filter((p) => p.state === 'available');
  const label =
    available.length === 1
      ? `Свободна одна — ${puppyShortLabel(available[0]!).toLowerCase()}`
      : available.length > 1
        ? `Свободно: ${available.length}`
        : null;

  const vkMeUrl = process.env.VK_GROUP_ME_URL ?? 'https://vk.me/veoomsk';

  return (
    <div className="mb-8 md:mb-10 flex flex-wrap items-center justify-center gap-3">
      {label && (
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-soft text-accent-dark ring-1 ring-accent/30 font-sans font-semibold text-sm">
          <span aria-hidden>🐾</span>
          {label}
        </span>
      )}
      <a
        href={vkMeUrl}
        target="_blank"
        rel="noopener"
        className={cn(
          'inline-flex items-center gap-2 min-h-[46px] px-[26px] py-3 rounded-full no-underline',
          'bg-accent text-white font-semibold text-[15px]',
          'shadow-[0_4px_12px_rgba(43,34,26,0.10)]',
          'transition-[transform,background-color,box-shadow] duration-150',
          'hover:bg-accent-hover hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(43,34,26,0.14)]',
        )}
      >
        <span aria-hidden>✉</span>
        Написать нам в VK
      </a>
    </div>
  );
}

function puppyShortLabel(puppy: Puppy): string {
  if (puppy.name && puppy.name.trim()) return puppy.name;
  const sexNoun = puppy.sex === 'male' ? 'мальчик' : 'девочка';
  const female = puppy.sex === 'female';
  switch (puppy.color) {
    case 'cheprachny':
      return `${female ? 'Чепрачная' : 'Чепрачный'} ${sexNoun}`;
    case 'zonarny':
      return `${female ? 'Зонарная' : 'Зонарный'} ${sexNoun}`;
    case 'cherny':
      return `${female ? 'Чёрная' : 'Чёрный'} ${sexNoun}`;
    default:
      return puppy.sex === 'male' ? 'Кобель' : 'Сука';
  }
}
