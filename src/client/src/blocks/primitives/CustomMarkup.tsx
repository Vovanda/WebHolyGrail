import { scopedAppearance, type BlockNode, type SiteSettings } from 'contracts';

/**
 * CustomMarkup — секция из произвольной разметки.
 *
 * @remarks
 * Server-only (R14): ни состояния, ни обработчиков — просто вставка.
 *
 * **Про безопасность.** Разметка попадает на страницу без очистки, и это
 * осознанно: блок для того и существует, чтобы вставить то, что готовые блоки
 * не умеют. Значит редактировать его может только тот, кому и так доверено
 * содержимое сайта — то же доверие, что и у доступа к шаблонам.
 *
 * Стили секции кладём в её собственный `<style>` рядом с разметкой: так они
 * едут вместе с блоком и исчезают вместе с ним, не оставляя следов в общем CSS.
 */
export interface CustomMarkupData {
  readonly html?: string;
  readonly css?: string;
  readonly fullWidth?: boolean;
}

export function CustomMarkup({
  node,
}: {
  readonly node: BlockNode & { data?: CustomMarkupData };
  readonly settings: SiteSettings;
}) {
  const data = node.data ?? {};
  if (!data.html) return null;

  /*
    Стиль своей разметки ограничен блоком - так же, как «Свой стиль» у всех
    остальных блоков. Раньше он вставлялся как есть и правил всю страницу:
    одна опечатка в селекторе - и последствия по всему сайту, а причину
    ищи в блоке на дальней странице.
  */
  const scoped = scopedAppearance(String(node.id ?? ''), data.css);

  return (
    <section
      data-block={String(node.id ?? '')}
      className={data.fullWidth ? '' : 'mx-auto max-w-wide px-4 md:px-6'}
    >
      {scoped && <style dangerouslySetInnerHTML={{ __html: scoped }} />}
      <div data-part="markup" dangerouslySetInnerHTML={{ __html: data.html }} />
    </section>
  );
}
