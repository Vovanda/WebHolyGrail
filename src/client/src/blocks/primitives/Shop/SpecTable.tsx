/**
 * Характеристики позиции строками «название …… значение», группами раздела.
 *
 * @remarks
 * Точечный заполнитель ведёт глаз от названия к значению на широкой строке,
 * как в справочниках и у больших магазинов. Части: `spec-table`, `spec-group`,
 * `spec-row`.
 */
export function SpecTable({
  rows,
  columns = 1,
}: {
  /** Сколько колонок групп на широком экране: блок во всю ширину ставит две. */
  readonly columns?: 1 | 2;
  readonly rows: readonly {
    readonly key: string;
    readonly title: string;
    readonly value: string;
    readonly group?: string | null | undefined;
  }[];
}) {
  if (rows.length === 0) return null;
  const groups: { title: string | null; rows: typeof rows }[] = [];
  for (const row of rows) {
    const title = row.group ?? null;
    const found = groups.find((g) => g.title === title);
    if (found) (found.rows as (typeof row)[]).push(row);
    else groups.push({ title, rows: [row] });
  }
  return (
    <div
      data-part="spec-table"
      className={columns === 2 ? 'gap-x-12 text-sm lg:columns-2 [&>*]:mb-6' : 'grid gap-6 text-sm'}
    >
      {groups.map((group) => (
        <section key={group.title ?? ''} data-part="spec-group" className="break-inside-avoid">
          {group.title && <h3 className="mb-2 font-semibold text-ink">{group.title}</h3>}
          <dl className="grid gap-2">
            {group.rows.map((row) => (
              <div key={row.key} data-part="spec-row" className="flex items-baseline gap-2">
                <dt className="shrink-0 text-muted">{row.title}</dt>
                <span
                  aria-hidden="true"
                  className="mb-1 min-w-4 flex-1 border-b border-dotted border-border-strong"
                />
                <dd className="max-w-[55%] text-right text-ink">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
