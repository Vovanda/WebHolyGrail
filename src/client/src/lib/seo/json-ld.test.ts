import { describe, expect, it } from 'vitest';

import { jsonLd } from './json-ld';

describe('JSON-LD внутри script', () => {
  it('</script> в строке не закрывает тег', () => {
    const text = jsonLd({ name: 'Иван</script><script>alert(1)</script>' });
    expect(text).not.toContain('</script');
    expect(text).not.toContain('<');
  });

  it('после разбора строка та же', () => {
    const value = { name: 'a < b </script>', n: 1 };
    expect(JSON.parse(jsonLd(value))).toEqual(value);
  });
});
