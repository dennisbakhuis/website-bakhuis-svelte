import { describe, expect, it } from 'vitest';
import { profileSpark, routeLine, sameDepth, typesRawAddsNothing } from './dive-page';

describe('typesRawAddsNothing', () => {
  it('is true for empty input', () => {
    expect(typesRawAddsNothing(null, ['cave'])).toBe(true);
    expect(typesRawAddsNothing('', [])).toBe(true);
  });

  it('ignores case, spacing and separators', () => {
    expect(typesRawAddsNothing('Cave / Scooter', ['cave', 'scooter'])).toBe(true);
    expect(typesRawAddsNothing('cave, deep', ['deep', 'cave', 'night'])).toBe(true);
  });

  it('is false when a ticked type is not a tag', () => {
    expect(typesRawAddsNothing('cave / photo', ['cave'])).toBe(false);
  });
});

describe('profileSpark', () => {
  it('is empty below two samples', () => {
    expect(profileSpark([{ t: 0, d: 0 }], 100, 40)).toEqual({ line: '', area: '' });
  });

  it('puts the surface on top and the deepest point on the bottom edge', () => {
    const s = profileSpark(
      [
        { t: 0, d: 0 },
        { t: 50, d: 20 },
        { t: 100, d: 10 },
      ],
      104,
      44,
    );
    expect(s.line).toBe('M2 2 L52 42 L102 22');
    expect(s.area).toBe('M2 2 L52 42 L102 22 L102 0 L2 0 Z');
  });
});

describe('routeLine', () => {
  it('joins the known parts', () => {
    expect(
      routeLine(1320.4, {
        turnedAt: 'Roundabout',
        deepest: { label: 'First Strike Run', depth: 26 },
      }),
    ).toBe('1320 m swum · turned at Roundabout · deepest 26 m at First Strike Run');
  });

  it('skips missing parts', () => {
    expect(routeLine(0, { turnedAt: 'T1', deepest: null })).toBe('turned at T1');
    expect(routeLine(0, { turnedAt: null, deepest: null })).toBe('');
  });
});

describe('sameDepth', () => {
  it('compares formatted depths', () => {
    expect(sameDepth(26.8, 26.8)).toBe(true);
    expect(sameDepth(28, 26.8)).toBe(false);
    expect(sameDepth(null, 26.8)).toBe(false);
  });
});
