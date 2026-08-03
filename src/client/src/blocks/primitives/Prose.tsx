import { cva, type VariantProps } from 'class-variance-authority';
import type { BlockNode, SiteSettings } from 'contracts';

import { cn } from '@/lib/utils';
import { fillPersonalData, personalDataOf } from '@/lib/placeholders';
import { ContentFrame } from '@/layouts/ContentFrame';

/**
 * Prose / RichText — **3-й общий компонент** (см. R5++). Любой содержательный
 * абзацный текст: «О нас», био, ответ FAQ, текст поста блога, манифест.
 *
 * @remarks
 * **Варианты дизайна (CVA):**
 *  - `editorial-with-dropcap` — editorial-стиль: Cormorant italic 22px, **акцентная
 *    буквица 64px на первом абзаце**. Для крупных «О нас», манифестов.
 *  - `editorial-plain` — то же без буквицы. Для FAQ-ответов, secondary-секций.
 *  - `modern-sans` — Inter 16-18px, normal style. Для обычных текстовых блоков.
 *
 * Контент пока plain-text-абзацы (split по `\n\n`). Когда понадобится — заменим
 * на rich-text-renderer для Lexical-AST из Payload (Шаг 4.4+).
 */
// max-w-[68ch]: строка длиннее ~75 символов теряется при переносе — глаз не
// находит начало следующей. В ландшафте на телефоне без ограничения строка
// уходила за сотню символов на всю ширину экрана.
const proseRoot = cva('relative mx-auto max-w-[68ch] px-6 md:px-10 text-left', {
  variants: {
    variant: {
      'editorial-with-dropcap':
        'font-display italic font-medium text-ink text-lg md:text-[22px] leading-[1.55] tracking-[0.01em]',
      'editorial-plain':
        'font-display italic font-medium text-ink text-lg md:text-[22px] leading-[1.55]',
      'modern-sans': 'font-sans text-ink text-base md:text-lg leading-relaxed',
    },
  },
  defaultVariants: { variant: 'editorial-with-dropcap' },
});

type ProseVariantProps = VariantProps<typeof proseRoot>;

export interface ProseData {
  /**
   * Текст — поддерживает абзацы через двойной перенос (`\n\n`). Будущая версия
   * примет Lexical-AST из Payload.
   */
  readonly body: string;
  readonly variant?: ProseVariantProps['variant'];
}

const defaultBody = [
  'В нашем business мы тщательно отбираем производителей: они участвуют в выставках и получают отличные оценки, проходят курсы дрессировки, тесты и ежегодную диспансеризацию.',
  'Все item привиты, обработаны от паразитов и проходят регулярные медицинские проверки, прививки прививаются в установленные сроки и в полном соответствии с памяткой ДМ.',
  'Щенки чёрного, зонарного и чепрачного окраса растут в нашем доме, контактны и социализированы. Они получают качественное питание и уход. Все product имеют документы РКФ-FCI.',
].join('\n\n');

export function Prose({
  node,
  settings,
}: {
  readonly node: BlockNode & { data?: Partial<ProseData> };
  readonly settings: SiteSettings;
}) {
  const raw = node.data?.body ?? defaultBody;

  // Реквизиты подставляются вместо меток {{operatorName}} и подобных. Так текст
  // остаётся обычной страницей, которую владелец правит сам, а данные оператора
  // лежат в одном месте и не переписываются по всему документу.
  const { text, missing } = fillPersonalData(raw, personalDataOf(settings));

  const data: ProseData = {
    body: text,
    variant: node.data?.variant ?? 'editorial-with-dropcap',
  };

  const paragraphs = data.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const useDropcap = data.variant === 'editorial-with-dropcap';

  return (
    <section className="bg-bg pt-2 pb-10 md:pb-14">
      {/* Незаполненные реквизиты — не мелочь: документ без них не работает, а
          выглядит готовым. Поэтому предупреждение видно прямо на странице, а не
          только в админке. */}
      {missing.length > 0 && (
        <div className="mx-auto mb-6 max-w-[68ch] rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-4 py-3 text-sm text-ink">
          <strong className="font-semibold">Черновик.</strong> Документ не заполнен до конца: не
          хватает данных ({missing.join(', ')}). Заполните их в настройках сайта, раздел «Обработка
          персональных данных».
        </div>
      )}
      <ContentFrame side="both" decor="vines" className={proseRoot({ variant: data.variant })}>
        {paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            className={cn('m-0 mb-[18px] last:mb-0', useDropcap && idx === 0 && 'with-dropcap')}
          >
            {paragraph}
          </p>
        ))}
      </ContentFrame>
    </section>
  );
}
