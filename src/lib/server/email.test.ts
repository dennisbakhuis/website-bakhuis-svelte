import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeHeader, singleAddressOrThrow } from './email';

describe('email helpers', () => {
  it('sanitises header values', () => {
    expect(sanitizeHeader('a\nb\tc  ')).toBe('a b c');
    expect(sanitizeHeader('x'.repeat(300)).length).toBe(200);
  });

  it('escapes html', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;',
    );
  });

  it('accepts one address only', () => {
    expect(singleAddressOrThrow('a@b.co')).toBe('a@b.co');
    expect(() => singleAddressOrThrow('a@b.co, c@d.co')).toThrow();
    expect(() => singleAddressOrThrow('Name <a@b.co>')).toThrow();
  });
});
