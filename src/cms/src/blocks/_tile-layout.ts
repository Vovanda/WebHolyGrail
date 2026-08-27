import type { Block, Field } from 'payload';
import { parseAreas } from 'contracts';

/**
 * Поле раскладки плиток - общее для всех блоков, которые её допускают.
 *
 * @remarks
 * Владелец задаёт фигуру строкой вида «a b : a c»: имена областей, ряды через
 * двоеточие. Подробности записи - в разборе, он лежит в общем месте и им
 * пользуется и сайт, и эта проверка.
 *
 * Поле объявлено один раз и вешается списком в одном месте, а не копируется
 * в каждый блок руками: скопированное поле рано или поздно разъезжается -
 * где-то другое имя, где-то другая подсказка, где-то забыли проверку.
 */
export const TILE_LAYOUT_FIELDS: Field[] = [
  {
    name: 'tileLayout',
    label: 'Своя раскладка плиток',
    type: 'text',
    admin: {
      description:
        'Имена областей, ряды через двоеточие: «a b : a c». Повтор - числом: «3a». Точка - пустое место. Пусто - плитки встают сами.',
      placeholder: 'a b c : a b d',
    },
    validate: (value: unknown) => {
      const raw = typeof value === 'string' ? value.trim() : '';
      if (!raw) return true;
      return parseAreas(raw)
        ? true
        : 'Запись не складывается в сетку: ряды должны быть одной длины, а каждое имя - цельным прямоугольником.';
    },
  },
];

/** Помощник: вернёт копию блока с полем раскладки в конце. */
export function withTileLayout(block: Block): Block {
  return {
    ...block,
    fields: [...block.fields, ...TILE_LAYOUT_FIELDS],
  };
}
