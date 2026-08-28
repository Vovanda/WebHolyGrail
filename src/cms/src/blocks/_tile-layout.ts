import type { Block, Field } from 'payload';
import { parseAreas } from 'contracts';

/**
 * Поля раскладки плиток - общие для всех блоков, которые её допускают.
 *
 * @remarks
 * Владелец задаёт фигуру строкой вида «a b : a c»: имена областей, ряды через
 * двоеточие. Подробности записи - в разборе, он лежит в общем месте и им
 * пользуется и сайт, и эта проверка.
 *
 * Записей три, по ширинам окна. Одна фигура на все ширины не годится: то, что
 * читается на большом экране, на среднем тесно, а на малом рассыпается, и порядок
 * карточек там нужен свой.
 *
 * Названы записи по ширине окна, а не по устройству: окно на большом мониторе
 * бывает узким, а планшет держат и поперёк.
 *
 * Каждая ширина живёт сама по себе: незаполненная запись не наследуется, а
 * считается заново под свою вместимость. Иначе фигура из четырёх колонок
 * приехала бы на телефон и раздавила карточки.
 *
 * Поля объявлены один раз и вешаются списком в одном месте, а не копируются
 * в каждый блок руками: скопированное поле рано или поздно разъезжается -
 * где-то другое имя, где-то другая подсказка, где-то забыли проверку.
 */

const HOW =
  'Имя в соседних ячейках - карточка шире, в двух рядах - выше. ' +
  'Повтор «2a». Пустое место «.». Скрыть карточку «-f». ' +
  'Закомментировать строку целиком: «#a b : c d».';

function check(value: unknown): string | true {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return true;

  // Решётка в начале выключает запись, не стирая её - это не ошибка.
  if (raw.startsWith('#')) return true;
  return parseAreas(raw)
    ? true
    : 'Запись не складывается в сетку: имя должно занимать цельный прямоугольник.';
}

export const TILE_LAYOUT_FIELDS: Field[] = [
  {
    type: 'collapsible',
    label: 'Раскладка плиток',
    admin: {
      initCollapsed: true,
      description: HOW,
    },
    fields: [
      {
        name: 'tileLayout',
        label: 'Большой экран - от 1024 точек',
        type: 'text',
        admin: {
          description: 'Пусто - плитки встают сами.',
          placeholder: 'a a b : a a c : d e c',
        },
        validate: check,
      },
      {
        name: 'tileLayoutMd',
        label: 'Средний экран - от 768 до 1023 точек',
        type: 'text',
        admin: {
          description: 'Пусто - по двое в ряд.',
          placeholder: 'a a : b c',
        },
        validate: check,
      },
      {
        name: 'tileLayoutSm',
        label: 'Малый экран - до 767 точек',
        type: 'text',
        admin: {
          description: 'Пусто - столбиком.',
          placeholder: 'a : b : c',
        },
        validate: check,
      },
    ],
  },
];

/**
 * Помощник: вернёт копию блока с полями раскладки.
 *
 * @remarks
 * Раскладка встаёт перед списком карточек, а не в конце: она про то, как они
 * лягут, и читается раньше, чем сам список. Списки бывают длинными, и настройка
 * под ними теряется.
 */
export function withTileLayout(block: Block): Block {
  const at = block.fields.findIndex((field) => 'name' in field && field.name === 'items');
  if (at < 0) return { ...block, fields: [...block.fields, ...TILE_LAYOUT_FIELDS] };

  return {
    ...block,
    fields: [...block.fields.slice(0, at), ...TILE_LAYOUT_FIELDS, ...block.fields.slice(at)],
  };
}
