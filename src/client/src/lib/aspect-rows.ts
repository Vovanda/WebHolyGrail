/**
 * Раскладка рядами одной высоты: доли роста для каждого кадра.
 *
 * @remarks
 * Здесь нет ни разметки, ни браузера - только числа, поэтому всё проверяется
 * без запуска сайта.
 *
 * Считать сами ряды на сервере нельзя: ширина места известна только браузеру.
 * Поэтому ряды набирает сама разметка - переносом, - а отсюда каждый кадр
 * получает две величины: во сколько раз он шире своей высоты и от какой ширины
 * ему расти. Кадры в ряду тянутся пропорционально, и ряд выходит одной высоты
 * без единой строчки кода в браузере.
 */

/** Кадр, каким он нужен раскладке: только форма. */
export interface Shape {
  readonly width?: number | null | undefined;
  readonly height?: number | null | undefined;
}

/** Место кадра в ряду. */
export interface Stretch {
  /** Во сколько раз кадр шире своей высоты. */
  readonly aspect: number;
  /** Ширина, от которой кадр растёт, в точках. */
  readonly basis: number;
}

/**
 * Пропорция кадра, приведённая к разумным пределам.
 *
 * @remarks
 * Совсем узкая панорама растянула бы ряд на всю ширину и оставила соседей
 * ни с чем, а совсем узкий вертикальный кадр сжался бы в полоску.
 *
 * Нижний предел - девять к шестнадцати, привычная форма вертикального кадра.
 * Съёмка с телефона бывает уже: кадр 874 на 1920 это девять к двадцати, и в ряду
 * он занимал бы полосу. В плитке такой кадр подрезается до предела, а целиком
 * его показывает лента - там он открывается как снят.
 */
const WIDEST = 2;
const NARROWEST = 9 / 16;

/** Высота ряда, от которой считается ширина кадра. */
const ROW_HEIGHT = 240;

export function stretchOf(shape: Shape): Stretch {
  const width = shape.width ?? 0;
  const height = shape.height ?? 0;
  const raw = width > 0 && height > 0 ? width / height : 1;
  const aspect = Math.min(WIDEST, Math.max(NARROWEST, raw));
  return { aspect, basis: Math.round(aspect * ROW_HEIGHT) };
}

/**
 * Доли роста для всего набора.
 *
 * @remarks
 * Последний ряд отдельного обхождения не требует: перенос оставляет его
 * неполным, и кадры в нём растягиваются на всю ширину - тем сильнее, чем
 * их меньше. Чтобы одинокий кадр не занял ряд целиком, у ряда есть предел
 * роста, и задаётся он разметкой.
 */
export function stretchAll(shapes: readonly Shape[]): Stretch[] {
  return shapes.map(stretchOf);
}

/** Ширины экрана, под которые ряды считаются заранее: телефон, 768, широкий. */
export type RowWidth = 'sm' | 'md' | 'lg';

/**
 * Сколько единиц пропорции вмещает ряд на каждой ширине.
 *
 * @remarks
 * Это ширина колонки, делённая на желаемую высоту ряда: на широком экране
 * колонка около 1250 точек и ряд около 400 в высоту, на 768 - 720 и 300,
 * на телефоне - 340 и 240. Кадр 4:3 занимает 1.33 единицы, стоячий 9:16 -
 * 0.56: широкий ряд берёт два-три обычных снимка, и пять кадров разной формы
 * ложатся двумя рядами, а не одной полосой.
 */
export const ROW_CAPACITY: Readonly<Record<RowWidth, number>> = { sm: 1.4, md: 2.4, lg: 3 };

/**
 * Сумма пропорций ряда, по которой видна его высота.
 *
 * @remarks
 * Ряд с суммой меньше единицы не дотягивается до краёв: по правилам flex
 * строка с суммой `flex-grow` меньше 1 раздаёт только эту долю свободного
 * места. Стоячий кадр один в ряду занимает свою долю ширины, и высота ряда
 * равна ширине колонки, а не ширине, делённой на сумму.
 */
export function visibleSum(sum: number): number {
  return Math.max(sum, 1);
}

/** Кадры по порядку на ровно `rows` рядов с ближайшими по высоте рядами. */
function partition(aspects: readonly number[], rows: number): number[] {
  const count = aspects.length;
  const prefix = [0];
  for (const aspect of aspects) prefix.push((prefix.at(-1) as number) + aspect);
  /*
    Цена - отклонение логарифма суммы ряда от среднего: высота ряда обратна
    сумме, и глаз видит отношение высот, а не разницу сумм.
  */
  const mean = Math.log((prefix[count] as number) / rows);
  const cost = (from: number, to: number) =>
    (Math.log(visibleSum((prefix[to] as number) - (prefix[from] as number))) - mean) ** 2;

  // best[r][j] - наименьшая цена разложить первые j кадров на r рядов.
  const best: number[][] = Array.from({ length: rows + 1 }, () => Array(count + 1).fill(Infinity));
  const cut: number[][] = Array.from({ length: rows + 1 }, () => Array(count + 1).fill(0));
  (best[0] as number[])[0] = 0;
  for (let r = 1; r <= rows; r += 1) {
    for (let j = r; j <= count; j += 1) {
      for (let i = r - 1; i < j; i += 1) {
        const value = ((best[r - 1] as number[])[i] as number) + cost(i, j);
        if (value < ((best[r] as number[])[j] as number)) {
          (best[r] as number[])[j] = value;
          (cut[r] as number[])[j] = i;
        }
      }
    }
  }

  const lengths: number[] = [];
  let end = count;
  for (let r = rows; r >= 1; r -= 1) {
    const start = (cut[r] as number[])[end] as number;
    lengths.unshift(end - start);
    end = start;
  }
  return lengths;
}

/** Во сколько раз средний ряд может отойти от желаемой высоты ради ровности. */
const STRETCH_LIMIT = 1.6;

/**
 * Длины рядов: кадры по порядку делятся так, чтобы ряды вышли поровну.
 *
 * @remarks
 * Ряд растягивается на ширину колонки, и его высота обратна сумме пропорций
 * кадров в нём. Кадры идут по порядку, и граница между рядами выбирается так,
 * чтобы высоты рядов были как можно ближе (минимум квадратов отклонений
 * логарифма суммы - то есть отношения высот, а не разницы).
 *
 * Число рядов перебирается вокруг «суммарная пропорция / вместимость ряда»,
 * на ряд меньше и на ряд больше, и выигрывает вариант с меньшей ценой:
 * насколько средний ряд отходит от желаемой высоты плюс насколько ряды неравны.
 * Порядок кадров менять нельзя, поэтому ровнее иногда выходит на ряд меньше:
 * восемь снимков ложатся 4 + 4, а не 2 + 3 + 3 с последним рядом в полтора
 * раза ниже первого.
 */
export function balancedRowLengths(aspects: readonly number[], capacity: number): number[] {
  const count = aspects.length;
  if (count === 0) return [];
  const total = aspects.reduce((sum, aspect) => sum + aspect, 0);
  const ideal = total / capacity;
  const near = [Math.floor(ideal), Math.ceil(ideal)];
  // Соседние варианты - только пока ряд не уходит от желаемой высоты дальше
  // STRETCH_LIMIT: на телефоне ряд вдвое ниже желаемого - уже полоска.
  const far = [Math.floor(ideal) - 1, Math.ceil(ideal) + 1].filter(
    (rows) => rows > 0 && Math.abs(Math.log(total / rows / capacity)) <= Math.log(STRETCH_LIMIT),
  );
  const options = [...near, ...far]
    .map((rows) => Math.min(count, Math.max(1, rows)))
    .filter((rows, index, all) => all.indexOf(rows) === index);

  let chosen: number[] = [count];
  let chosenPrice = Infinity;
  for (const rows of options) {
    const lengths = partition(aspects, rows);
    let at = 0;
    const sums = lengths.map((length) => {
      const sum = aspects.slice(at, at + length).reduce((a, b) => a + b, 0);
      at += length;
      return sum;
    });
    // Неравенство рядов весит вдвое: ровность важнее точной высоты ряда.
    const price =
      Math.abs(Math.log(total / rows / capacity)) +
      2 * Math.log(Math.max(...sums.map(visibleSum)) / Math.min(...sums.map(visibleSum)));
    if (price < chosenPrice) {
      chosen = lengths;
      chosenPrice = price;
    }
  }
  return chosen;
}

/**
 * После каких кадров на каждой ширине кончается ряд.
 *
 * @remarks
 * Номера кадров, за которыми разметка ставит перенос строки для своей ширины.
 * Конец последнего ряда не нужен - там и так кончается набор.
 */
export function rowBreaks(shapes: readonly Shape[]): Record<RowWidth, number[]> {
  const aspects = shapes.map((shape) => stretchOf(shape).aspect);
  const breaksFor = (width: RowWidth) => {
    const lengths = balancedRowLengths(aspects, ROW_CAPACITY[width]);
    const out: number[] = [];
    let at = -1;
    for (const length of lengths.slice(0, -1)) {
      at += length;
      out.push(at);
    }
    return out;
  };
  return { sm: breaksFor('sm'), md: breaksFor('md'), lg: breaksFor('lg') };
}
