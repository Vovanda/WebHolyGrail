import { cva, type VariantProps } from 'class-variance-authority';
import type { BlockNode, SiteSettings } from '@veo55/contracts';

import { cn } from '@/lib/utils';

/**
 * Prose / RichText — **3-й общий компонент** (см. R5++). Любой содержательный
 * абзацный текст: «О нас», био, ответ FAQ, текст поста блога, манифест.
 *
 * @remarks
 * **Варианты дизайна (CVA):**
 *  - `editorial-with-dropcap` — veo55-стиль: Cormorant italic 22px, **янтарная
 *    буквица 64px на первом абзаце**. Из `.veo-desc` живого veo55.
 *  - `editorial-plain` — то же без буквицы. Для FAQ-ответов, secondary-секций.
 *  - `modern-sans` — Inter 16-18px, normal style. Для обычных текстовых блоков.
 *
 * Контент пока plain-text-абзацы (split по `\n\n`). Когда понадобится — заменим
 * на rich-text-renderer для Lexical-AST из Payload (Шаг 4.4+).
 */
const proseRoot = cva('relative mx-auto max-w-[880px] px-6 md:px-10 text-left', {
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
  'В нашем питомнике мы тщательно отбираем производителей: они участвуют в выставках и получают отличные оценки, проходят курсы дрессировки, тесты и ежегодную диспансеризацию.',
  'Все собаки привиты, обработаны от паразитов и проходят регулярные медицинские проверки, прививки прививаются в установленные сроки и в полном соответствии с памяткой ДМ.',
  'Щенки чёрного, зонарного и чепрачного окраса растут в нашем доме, контактны и социализированы. Они получают качественное питание и уход. Все щенки имеют документы РКФ-FCI.',
].join('\n\n');

export function Prose({
  node,
  settings: _settings,
}: {
  readonly node: BlockNode & { data?: Partial<ProseData> };
  readonly settings: SiteSettings;
}) {
  const data: ProseData = {
    body: node.data?.body ?? defaultBody,
    variant: node.data?.variant ?? 'editorial-with-dropcap',
  };

  const paragraphs = data.body.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  const useDropcap = data.variant === 'editorial-with-dropcap';

  return (
    <section className="bg-bg pt-2 pb-12 md:pb-16">
      <div className={proseRoot({ variant: data.variant })}>
        {paragraphs.map((paragraph, idx) => (
          <p
            key={idx}
            className={cn('m-0 mb-[18px] last:mb-0', useDropcap && idx === 0 && 'with-dropcap')}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
