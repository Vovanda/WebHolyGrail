'use client';

import { autocompletion, type CompletionContext } from '@codemirror/autocomplete';
import { css as cssLang } from '@codemirror/lang-css';
import { oneDark } from '@codemirror/theme-one-dark';
import { PALETTE_COLORS } from 'contracts';
import { useField } from '@payloadcms/ui';
import CodeMirror from '@uiw/react-codemirror';
import type { TextFieldClientComponent } from 'payload';
import type { CSSProperties } from 'react';
import { useState } from 'react';

/**
 * AppearanceField — оформление блока: код или поля, на выбор.
 *
 * @remarks
 * Значение одно и то же - строка CSS. Переключатель меняет только способ её
 * править: в поле пишут как есть, а форма показывает знакомые свойства
 * отдельными полями и собирает из них ту же строку.
 *
 * Форма построена по описанию, а не выложена руками: вид поля решает, какой
 * рисуется контрол. Новое свойство добавляется строчкой в описании, а не новой
 * разметкой, - иначе форма отстаёт от того, что умеет блок.
 *
 * Что форма не разобрала - вложенные правила, редкие свойства - остаётся в коде
 * нетронутым и дописывается к собранному. Правка в форме не должна выбрасывать
 * то, чего форма не понимает.
 */

type ControlKind = 'length' | 'corners' | 'color' | 'text';

/**
 * Как показать свойство в форме и как его назвать по-человечески.
 *
 * @remarks
 * Список - только подсказка: форма строится из того, что владелец действительно
 * написал. Свойства нет в списке - оно всё равно появится полем, просто
 * с обычным вводом и собственным именем.
 */
const KNOWN: Record<string, { label: string; kind: ControlKind; hint?: string; preset: string }> = {
  margin: { label: 'Отступы снаружи', kind: 'length', hint: '40px 0', preset: '40px 0' },
  'margin-top': { label: 'Отступ сверху', kind: 'length', hint: '40px', preset: '40px' },
  'margin-bottom': { label: 'Отступ снизу', kind: 'length', hint: '20px', preset: '24px' },
  padding: { label: 'Внутренние поля', kind: 'length', hint: '24px 32px', preset: '24px' },
  'border-radius': {
    label: 'Скругление углов',
    kind: 'corners',
    // Пример пишется так, как его примет браузер: значения углов разделяет
    // пробел. Перечисление через запятую человек повторяет буквально, а такое
    // объявление браузер молча отбрасывает.
    hint: '16px 16px 0 0 - верхние скруглены, нижние нет',
    preset: '16px',
  },
  background: { label: 'Заливка', kind: 'color', preset: 'var(--color-surface)' },
  color: { label: 'Цвет текста', kind: 'color', preset: 'var(--color-ink)' },
  border: {
    label: 'Рамка',
    kind: 'text',
    hint: '1px solid',
    preset: '1px solid var(--color-border)',
  },
};

/** Что предложить добавить, когда свойство ещё не задано. */
/**
 * Свойства, которые предлагаем добавить, - по тому, как часто они нужны блоку.
 *
 * @remarks
 * Первые - те, которыми правят вид в девяти случаях из десяти. Остальные
 * ищутся по части имени: искать быстрее, чем вспоминать, есть ли оно у нас.
 *
 * В коде подсказывать не нужно - там это делает сам редактор, как в среде
 * разработки.
 */
const CATALOG: readonly string[] = [
  'margin-top',
  'margin-bottom',
  'padding',
  'border-radius',
  'background',
  'color',
  'border',
  'box-shadow',
  'text-align',
  'max-width',
  'margin',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-transform',
  'opacity',
  'min-height',
  'height',
  'width',
  'display',
  'gap',
  'align-items',
  'justify-content',
  'flex-direction',
  'grid-template-columns',
  'overflow',
  'position',
  'z-index',
  'border-top',
  'border-bottom',
  'border-color',
  'outline',
  'transform',
  'transition',
  'filter',
  'backdrop-filter',
  'background-image',
  'background-size',
  'background-position',
  'object-fit',
  'aspect-ratio',
  'cursor',
];

function describe(prop: string): {
  label: string;
  kind: ControlKind;
  hint?: string;
  preset: string;
} {
  return KNOWN[prop] ?? { label: prop, kind: 'text', preset: '' };
}

/**
 * Понял ли браузер написанное.
 *
 * @remarks
 * Спрашиваем у самого браузера, а не сверяем со своим списком: он знает
 * все свойства и все значения, включая те, о которых мы не думали.
 *
 * Ответ - подсказка, а не запрет: значение сохраняется в любом случае.
 * Опечатку человек исправит сам, а вот отобранное поле ввода бесит.
 */
function understood(prop: string, value: string): boolean {
  const text = value.trim();
  if (!text) return true;
  try {
    return CSS.supports(prop, text);
  } catch {
    return true;
  }
}

/** Разобрать объявления верхнего уровня. Вложенные правила не трогаем. */
function readDeclarations(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  let depth = 0;
  let buffer = '';

  for (const char of css) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth === 0 && char === ';') {
      take(buffer, out);
      buffer = '';
      continue;
    }
    buffer += char;
  }
  take(buffer, out);
  return out;
}

function take(chunk: string, out: Record<string, string>): void {
  if (chunk.includes('{')) return;
  const at = chunk.indexOf(':');
  if (at < 0) return;
  const prop = chunk.slice(0, at).trim().toLowerCase();
  const value = chunk.slice(at + 1).trim();
  if (prop && value) out[prop] = value;
}

/** Всё, что формой не разбирается: вложенные правила и незнакомые свойства. */
function readRest(css: string, known: ReadonlySet<string>): string {
  const parts: string[] = [];
  let depth = 0;
  let buffer = '';

  const flush = (chunk: string) => {
    const text = chunk.trim();
    if (!text) return;
    if (text.includes('{')) {
      parts.push(text);
      return;
    }
    const prop = text.slice(0, text.indexOf(':')).trim().toLowerCase();
    if (!known.has(prop)) parts.push(text);
  };

  for (const char of css) {
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      buffer += char;
      if (depth === 0) {
        flush(buffer);
        buffer = '';
        continue;
      }
      continue;
    }
    if (depth === 0 && char === ';') {
      flush(buffer);
      buffer = '';
      continue;
    }
    buffer += char;
  }
  flush(buffer);
  return parts.join(';\n');
}

/** Селектор, которым владелец задаёт вид в тёмной теме. */
const DARK = '[data-theme="dark"] &';

/**
 * Значения для тёмной темы - из вложенного правила темы.
 *
 * @remarks
 * Цвет палитры едет вместе с темой сам, а вписанный своей рукой остаётся как
 * вписан: светлый прямоугольник в тёмной теме. Поэтому свой цвет спрашиваем
 * дважды, а второе значение кладём в правило темы.
 */
function readDark(css: string): Record<string, string> {
  const at = css.indexOf(DARK);
  if (at < 0) return {};
  const open = css.indexOf('{', at);
  if (open < 0) return {};

  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return readDeclarations(css.slice(open + 1, i));
    }
  }
  return {};
}

/** Убрать правило темы: остальное собирается заново. */
function withoutDark(css: string): string {
  const at = css.indexOf(DARK);
  if (at < 0) return css;
  const open = css.indexOf('{', at);
  if (open < 0) return css;

  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return (css.slice(0, at) + css.slice(i + 1)).trim();
    }
  }
  return css;
}

function buildDark(dark: Record<string, string>): string {
  const lines = Object.entries(dark)
    .filter(([, value]) => value.trim())
    .map(([prop, value]) => `${prop}: ${value.trim()};`);
  if (!lines.length) return '';
  return `${DARK} { ${lines.join(' ')} }`;
}

function build(values: Record<string, string>, order: readonly string[], rest: string): string {
  const lines = order
    .filter((prop) => values[prop]?.trim())
    .map((prop) => `${prop}: ${values[prop]?.trim()};`);
  return [...lines, rest].filter(Boolean).join(String.fromCharCode(10));
}

const AppearanceField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, initialValue } = useField<string>({ path: path ?? field.name });
  const css = typeof value === 'string' ? value : '';

  /* Поля показываем сразу: код нужен реже, чем правка пары значений. */
  const [asForm, setAsForm] = useState(true);
  const [adding, setAdding] = useState('');
  /*
    Свойства, у которых значение стёрли до конца. В стиль они не пишутся -
    пустое объявление там ни к чему, - но строка в форме остаётся: иначе она
    исчезает под курсором, стоит стереть последний знак, и набрать своё
    значение уже некуда.
  */
  const [empty, setEmpty] = useState<readonly string[]>([]);

  /*
    Из чего состоит блок. Читается из кода самих компонентов по запросу:
    объявлять части рядом с блоком пришлось бы руками, и объявление разошлось бы
    с разметкой при первой правке.

    Глубину задаёт владелец: на нуле видно устройство самого блока, глубже -
    начинку вложенных компонентов.
  */
  const [partsDepth, setPartsDepth] = useState(2);
  const [parts, setParts] = useState<readonly { tag: string; name: string; depth: number }[]>([]);
  const [partsState, setPartsState] = useState<'нет' | 'идёт' | 'готово' | 'ошибка'>('нет');
  const [copied, setCopied] = useState('');
  /*
    Что лежит в сохранённой странице. К нему и возвращает откат: правка стиля -
    дело на пробу, и путь назад ведёт к последнему опубликованному виду,
    а не к тому, что успели натыкать до этого.
  */
  const saved = typeof initialValue === 'string' ? initialValue : '';

  const plain = withoutDark(css);
  const declarations = readDeclarations(plain);
  const props = Object.keys(declarations);
  const dark = readDark(css);
  const rest = readRest(plain, new Set(props));

  const compose = (
    values: Record<string, string>,
    order: readonly string[],
    darkValues: Record<string, string>,
  ) =>
    [build(values, order, rest), buildDark(darkValues)]
      .filter(Boolean)
      .join(String.fromCharCode(10));

  const change = (prop: string, next: string) => {
    const values = { ...declarations, [prop]: next };
    const order = props.includes(prop) ? props : [...props, prop];
    setValue(compose(values, order, dark));
  };

  const changeDark = (prop: string, next: string) => {
    setValue(compose(declarations, props, { ...dark, [prop]: next }));
  };

  /*
    Свойство добавляется сразу с разумным значением, а не пустым: человеку,
    который CSS не пишет, нужен готовый пример - его правят, а не сочиняют
    с нуля.
  */
  const add = (prop: string) => {
    const name = prop.trim().toLowerCase();
    if (!name || declarations[name] !== undefined) return;
    setAdding('');
    change(name, describe(name).preset);
  };

  /*
    Строки для вида как в средствах разработчика. Выключенная строка не стирается,
    а прячется в примечание - её легко вернуть галочкой.
  */
  const OFF = '/* off */ ';
  const shown = [...props, ...empty.filter((prop) => !props.includes(prop))];
  const rows = shown.map((prop) => {
    const raw = declarations[prop] ?? '';
    const on = !raw.startsWith(OFF);
    const value = on ? raw : raw.slice(OFF.length);
    const palette = PALETTE_COLORS.find((c) => c.value === value);
    const swatch = palette?.sample ?? (/^#|^rgb|^hsl/i.test(value) ? value : '');
    return { prop, value, on, swatch };
  });

  const writeRows = (next: readonly { prop: string; value: string; on: boolean }[]) => {
    const values: Record<string, string> = {};
    const order: string[] = [];
    for (const row of next) {
      if (!row.prop.trim()) continue;
      values[row.prop] = row.on ? row.value : `${OFF}${row.value}`;
      order.push(row.prop);
    }
    setValue(compose(values, order, dark));
  };

  const toggleRow = (index: number) => {
    writeRows(rows.map((row, i) => (i === index ? { ...row, on: !row.on } : row)));
  };

  const editRow = (index: number, prop: string, value: string) => {
    const target = rows[index];
    if (target && !value.trim()) {
      setEmpty((was) => (was.includes(prop) ? was : [...was, prop]));
    } else if (value.trim()) {
      setEmpty((was) => was.filter((name) => name !== prop));
    }
    writeRows(rows.map((row, i) => (i === index ? { ...row, prop, value } : row)));
  };

  const removeRow = (index: number) => {
    const target = rows[index];
    if (target) setEmpty((was) => was.filter((name) => name !== target.prop));
    writeRows(rows.filter((_, i) => i !== index));
  };

  const blockType = String(
    (field.admin?.custom as { blockType?: string } | undefined)?.blockType ?? '',
  );

  const loadParts = async () => {
    setPartsState('идёт');
    try {
      const response = await fetch(
        `/api/block-parts?blockType=${encodeURIComponent(blockType)}&depth=${partsDepth}`,
        { credentials: 'include' },
      );
      const body = (await response.json()) as { parts?: typeof parts };
      setParts(body.parts ?? []);
      setPartsState('готово');
    } catch {
      setPartsState('ошибка');
    }
  };

  const query = adding.trim().toLowerCase();
  const canAdd = CATALOG.filter(
    (prop) => declarations[prop] === undefined && (!query || prop.includes(query)),
  ).slice(0, 10);

  return (
    <div
      className="field-type textarea"
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <label style={{ fontSize: 13, color: 'var(--theme-elevation-700)' }}>
        {field.label as string}
      </label>

      <>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--theme-elevation-600)' }}>
          {field.admin?.description as string}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={asForm} onChange={(e) => setAsForm(e.target.checked)} />
            Показать полями вместо кода
          </label>

          <button
            type="button"
            onClick={() => setValue(saved)}
            disabled={css === saved}
            style={smallButton}
            title="Вернуть стиль к последнему сохранённому"
          >
            Отменить правки
          </button>

          <button
            type="button"
            onClick={() => setValue('')}
            disabled={!css}
            style={smallButton}
            title="Стереть стиль - блок вернётся к тому, как выглядит по умолчанию"
          >
            Очистить
          </button>
        </div>

        {/*
          Схема блока - из чего он собран. Читается из кода компонентов по кнопке,
          поэтому отвечает тому, что на странице действительно есть. Глубину
          задаёт владелец: на нуле видно устройство самого блока, глубже -
          начинку вложенных компонентов.
        */}
        <details style={{ fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--theme-elevation-700)' }}>
            Схема блока
          </summary>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <button type="button" onClick={() => void loadParts()} style={smallButton}>
              {partsState === 'идёт' ? 'Читаю…' : 'Показать схему'}
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              Глубина
              <input
                type="number"
                min={0}
                max={10}
                value={partsDepth}
                onChange={(e) => setPartsDepth(Math.max(0, Number(e.target.value) || 0))}
                style={{ width: 56 }}
              />
            </label>
            {partsState === 'ошибка' && (
              <span style={{ color: 'var(--theme-error-500, #b54848)' }}>
                Не получилось прочитать
              </span>
            )}
          </div>

          {partsState === 'готово' && parts.length === 0 && (
            <p style={{ margin: '6px 0 0', color: 'var(--theme-elevation-600)' }}>
              Именованных частей у этого блока нет - стиль ляжет на него целиком.
            </p>
          )}

          {parts.length > 0 && (
            /*
              Окно с кодом: номера строк, тёмный фон, подсветка под курсором -
              так сразу видно, что строку можно взять. Нажатие копирует селектор
              и показывает это на самой строке.
            */
            <div
              style={{
                marginTop: 6,
                borderRadius: 4,
                border: '1px solid var(--theme-elevation-150)',
                background: 'var(--theme-elevation-50)',
                overflow: 'hidden',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12,
              }}
            >
              {parts.map((part, index) => (
                <button
                  key={part.name}
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(`[data-part=${part.name}]`);
                    setCopied(part.name);
                    window.setTimeout(() => setCopied(''), 1200);
                  }}
                  title="Нажмите, чтобы скопировать селектор"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    border: 0,
                    background: copied === part.name ? 'var(--theme-success-100, #e6f4ea)' : 'none',
                    padding: '2px 8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    color: 'var(--theme-elevation-800)',
                  }}
                  onMouseEnter={(e) => {
                    if (copied !== part.name)
                      e.currentTarget.style.background = 'var(--theme-elevation-100)';
                  }}
                  onMouseLeave={(e) => {
                    if (copied !== part.name) e.currentTarget.style.background = 'none';
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      flexShrink: 0,
                      textAlign: 'right',
                      color: 'var(--theme-elevation-400)',
                      userSelect: 'none',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span style={{ paddingLeft: part.depth * 14 }}>
                    {part.tag}
                    {`[data-part=${part.name}]`}
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--theme-elevation-500)' }}>
                    {copied === part.name ? 'скопировано' : 'копировать'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </details>

        {asForm ? (
          /*
            Вид как в средствах разработчика браузера: список строк
            «свойство: значение», галочка слева выключает строку, не стирая её,
            а пустая строка внизу добавляет новую. Ничего изобретать не нужно -
            этим видом пользуются каждый день, и он уже привычен.
          */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 13,
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 4,
              padding: 8,
            }}
          >
            {rows.map((row, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={() => toggleRow(index)}
                  title={row.on ? 'Выключить строку' : 'Включить строку'}
                />
                <input
                  type="text"
                  list="appearance-props"
                  value={row.prop}
                  onChange={(e) => editRow(index, e.target.value, row.value)}
                  placeholder="свойство"
                  style={{ ...cellStyle, flex: '0 0 40%', opacity: row.on ? 1 : 0.5 }}
                />
                <span style={{ color: 'var(--theme-elevation-500)' }}>:</span>
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => editRow(index, row.prop, e.target.value)}
                  onKeyDown={(e) => {
                    // Первый раз стирают значение, второй - убирают строку:
                    // так ведут себя списки везде, и палец сам знает, что делать.
                    if (e.key === 'Backspace' && !row.value) {
                      e.preventDefault();
                      removeRow(index);
                    }
                  }}
                  placeholder={describe(row.prop).hint ?? 'значение'}
                  style={{
                    ...cellStyle,
                    flex: 1,
                    opacity: row.on ? 1 : 0.5,
                    // Непонятое значение видно сразу по полю, а не по значку
                    // рядом: значок ищут глазами, а рамку - нет.
                    borderColor: understood(row.prop, row.value)
                      ? undefined
                      : 'var(--theme-warning-500, #d99000)',
                  }}
                />
                {row.swatch && (
                  <span
                    title={row.value}
                    style={{
                      width: 20,
                      height: 20,
                      flexShrink: 0,
                      borderRadius: 3,
                      border: '1px solid var(--theme-elevation-150)',
                      background: row.swatch,
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  title="Убрать строку"
                  style={{ ...smallButton, padding: '0 6px' }}
                >
                  ×
                </button>

                {!understood(row.prop, row.value) && (
                  <span
                    title="Значение сохранится, но на странице не подействует."
                    style={{
                      color: 'var(--theme-warning-600, #a86400)',
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                    }}
                  >
                    браузер не понял
                  </span>
                )}
              </div>
            ))}

            {/*
              Свой цвет в тёмной теме останется таким, каким вписан - светлым
              пятном на тёмной странице. Поэтому под ним спрашиваем второе
              значение; цвет из палитры переключается сам, и строки не просит.
            */}
            {rows
              .filter(
                (row) =>
                  describe(row.prop).kind === 'color' &&
                  row.value.trim() &&
                  !PALETTE_COLORS.some((c) => c.value === row.value),
              )
              .map((row) => (
                <div
                  key={`dark-${row.prop}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span style={{ width: 13 }} />
                  <span style={{ flex: '0 0 40%', color: 'var(--theme-elevation-500)' }}>
                    {row.prop} в тёмной
                  </span>
                  <span style={{ color: 'var(--theme-elevation-500)' }}>:</span>
                  <input
                    type="text"
                    value={dark[row.prop] ?? ''}
                    onChange={(e) => changeDark(row.prop, e.target.value)}
                    placeholder="например #1f2937"
                    style={{ ...cellStyle, flex: 1 }}
                  />
                  {dark[row.prop] && (
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        flexShrink: 0,
                        borderRadius: 3,
                        border: '1px solid var(--theme-elevation-150)',
                        background: dark[row.prop],
                      }}
                    />
                  )}
                </div>
              ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 13 }} />
              <input
                type="text"
                list="appearance-props"
                value={adding}
                onChange={(e) => setAdding(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    add(adding || (canAdd[0] ?? ''));
                  }
                }}
                placeholder="добавить свойство"
                style={{ ...cellStyle, flex: 1 }}
              />
            </div>

            <datalist id="appearance-props">
              {canAdd.map((prop) => (
                <option key={prop} value={prop}>
                  {describe(prop).label}
                </option>
              ))}
            </datalist>

            {rest && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--theme-elevation-600)' }}>
                Правила для того, что внутри блока, показаны только в коде.
              </p>
            )}
          </div>
        ) : (
          <div
            style={{
              border: '1px solid var(--theme-elevation-150)',
              borderRadius: 4,
              overflow: 'auto',
              maxHeight: 320,
            }}
          >
            {/*
              Редактор, а не простое поле: подсветка, парные скобки и подсказка
              свойств - та же, что в среде разработки. Отдельный список свойств
              для кода не нужен, редактор подсказывает сам.
            */}
            <CodeMirror
              value={css}
              onChange={(next) => setValue(next)}
              theme={oneDark}
              extensions={[cssLang(), autocompletion({ override: [propertyHints] })]}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                indentOnInput: true,
                tabSize: 2,
                foldGutter: false,
              }}
              placeholder="margin: 40px 0; border-radius: 16px 16px 0 0;"
            />
          </div>
        )}
      </>
    </div>
  );
};

/**
 * Подсказка свойств в коде.
 *
 * @remarks
 * Своя, а не готовая: в поле пишут объявления без селектора, и на верхнем
 * уровне редактор ждёт селектор - оттуда и подсказывал что угодно, только
 * не отступы. Здесь предлагаются те же свойства, что и в форме, и в том же
 * порядке - сперва частые.
 */
function propertyHints(context: CompletionContext) {
  const word = context.matchBefore(/[-a-z]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  return {
    from: word.from,
    options: CATALOG.map((prop, index) => ({
      label: prop,
      type: 'property',
      apply: `${prop}: `,
      boost: CATALOG.length - index,
    })),
  };
}

const cellStyle: CSSProperties = {
  border: 0,
  background: 'transparent',
  color: 'var(--theme-elevation-800)',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  padding: '2px 4px',
};

const smallButton: CSSProperties = {
  background: 'none',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 4,
  padding: '2px 10px',
  fontSize: 12,
  cursor: 'pointer',
  color: 'var(--theme-elevation-700)',
};

export default AppearanceField;
