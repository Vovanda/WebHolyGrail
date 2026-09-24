import type { Shot } from './types';

/**
 * С какой длины текст сворачивается.
 *
 * @remarks
 * Короткая подпись помещается в строку целиком, и слово «ещё» рядом с ней
 * обещает продолжение, которого нет: под кадром стояло «test-do-not-use ещё».
 * Порог взят по ширине подписи - около строки на широком экране.
 */
const LONG = 90;

/**
 * Подпись под кадром в ленте.
 *
 * @remarks
 * Три текста у файла означают разное. Название - заголовок для зрителя.
 * Описание - подробности для него же. Подпись `alt` пишется для тех, кто кадра
 * не видит, поэтому здесь она идёт только когда описания нет вовсе: иначе под
 * снимком стояли бы две фразы об одном и том же.
 *
 * Описание показывается одной строкой, остальное раскрывается по слову «ещё»:
 * развёрнутый текст закрывает нижнюю треть снимка. Собрано на `details`,
 * без своего кода в браузере.
 */
export function LaneCaption({ shot }: { readonly shot: Shot }) {
  const note = shot.note || (shot.alt !== shot.title ? shot.alt : '');
  if (!shot.title && !note) return null;

  const long = note.length > LONG;

  return (
    <figcaption
      data-part="lane-caption"
      // Кнопка файла стоит в правом нижнем углу. На широком
      // экране подписи хватает места справа от неё, на узком подпись встаёт
      // над кнопкой - иначе кнопка ложится на «ещё» и забирает касание.
      className="pointer-events-auto mx-auto w-full max-w-[64ch] px-6 pb-16 md:pb-5 md:pr-32 text-on-media"
    >
      {shot.title && <div className="text-base font-medium">{shot.title}</div>}
      {note &&
        (long ? (
          <details className="group mt-1 text-sm text-on-media-muted">
            <summary className="flex cursor-pointer list-none items-baseline gap-1">
              <span className="line-clamp-1 group-open:line-clamp-none">{note}</span>
              <span className="shrink-0 underline group-open:hidden">ещё</span>
            </summary>
          </details>
        ) : (
          <div className="mt-1 text-sm text-on-media-muted">{note}</div>
        ))}
    </figcaption>
  );
}
