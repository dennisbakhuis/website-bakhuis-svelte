import { describe, expect, it } from 'vitest';
import { formatDate, formatLongDate } from './format';

describe('formatDate', () => {
  it('formats an ISO date in British short form', () => {
    expect(formatDate('2026-10-09')).toBe('9 Oct 2026');
  });

  it('shows a dash for a missing date', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });
});

describe('formatLongDate', () => {
  it('spells out the weekday and month', () => {
    expect(formatLongDate('2026-10-09')).toBe('Friday, 9 October 2026');
  });
});
