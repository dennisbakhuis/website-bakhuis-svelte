import { describe, expect, it } from 'vitest';
import { GO_TARGETS, goHref, isGoTarget } from './go-targets';

describe('go targets', () => {
  it('recognises known targets only', () => {
    expect(isGoTarget('email')).toBe(true);
    expect(isGoTarget('github')).toBe(true);
    expect(isGoTarget('nope')).toBe(false);
    expect(isGoTarget('__proto__')).toBe(false);
  });

  it('builds labelled hrefs', () => {
    expect(goHref('linkedin', 'footer')).toBe('/go/linkedin?from=footer');
    expect(GO_TARGETS.email.href.startsWith('mailto:')).toBe(true);
  });
});
