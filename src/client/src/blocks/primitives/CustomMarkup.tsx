import type { BlockNode, SiteSettings } from 'contracts';

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

  return (
    <section className={data.fullWidth ? '' : 'mx-auto max-w-wide px-4 md:px-6'}>
      {data.css && <style dangerouslySetInnerHTML={{ __html: data.css }} />}
      <div dangerouslySetInnerHTML={{ __html: data.html }} />
    </section>
  );
}
