import { describe, expect, it } from 'vitest';

import { normalizeEmail, normalizePhone } from './identity.js';

describe('опознание по телефону', () => {
  it('один номер в разных записях совпадает сам с собой', () => {
    const forms = ['+7 (912) 345-67-89', '8 912 345 67 89', '79123456789', '9123456789'];
    const normalized = new Set(forms.map(normalizePhone));
    expect(normalized.size).toBe(1);
    expect([...normalized][0]).toBe('79123456789');
  });

  it('короткий мусор не считается номером', () => {
    // Иначе доступ нашёлся бы не тому: поиск по обрывку строки.
    expect(normalizePhone('123')).toBe('');
    expect(normalizePhone('нет')).toBe('');
  });

  it('иностранный номер сохраняется как есть', () => {
    expect(normalizePhone('+380 67 123 45 67')).toBe('380671234567');
  });
});

describe('опознание по почте', () => {
  it('регистр и пробелы не мешают совпадению', () => {
    expect(normalizeEmail('  Ivan@Example.COM ')).toBe('ivan@example.com');
  });

  it('строка без адреса отбрасывается', () => {
    expect(normalizeEmail('не почта')).toBe('');
    expect(normalizeEmail('ivan@')).toBe('');
  });
});
