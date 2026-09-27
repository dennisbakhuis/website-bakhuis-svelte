import { describe, expect, it } from 'vitest';
import {
  flagEmoji,
  formatDate,
  formatDepth,
  formatHours,
  formatMinutes,
  formatTemp,
  formatTime,
  gasLabel,
  modeLabel,
  pluralize,
} from './format';

describe('formatMinutes', () => {
  it('renders hours and minutes', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(125)).toBe('2 h 5 min');
  });
});

describe('formatHours', () => {
  it('drops the decimal on whole hours', () => {
    expect(formatHours(120)).toBe('2 h');
    expect(formatHours(90)).toBe('1.5 h');
  });
});

describe('depth and temperature', () => {
  it('formats with units and a dash for missing values', () => {
    expect(formatDepth(20)).toBe('20 m');
    expect(formatDepth(20.5)).toBe('20.5 m');
    expect(formatDepth(null)).toBe('—');
    expect(formatTemp(12.6)).toBe('13 °C');
    expect(formatTemp(undefined)).toBe('—');
  });
});

describe('dates and times', () => {
  it('formats ISO dates without timezone drift', () => {
    expect(formatDate('2024-05-08')).toBe('8 May 2024');
    expect(formatDate(null)).toBe('—');
    expect(formatTime('10:30:00')).toBe('10:30');
    expect(formatTime(null)).toBe('');
  });
});

describe('flagEmoji', () => {
  it('maps ISO codes to regional indicators', () => {
    expect(flagEmoji('NL')).toBe('🇳🇱');
    expect(flagEmoji('fr')).toBe('🇫🇷');
    expect(flagEmoji('XX')).toBe('');
    expect(flagEmoji('')).toBe('');
  });
});

describe('labels', () => {
  it('describes gas and mode', () => {
    expect(gasLabel('air', 21, null)).toBe('Air');
    expect(gasLabel('nitrox', 32, null)).toBe('Nitrox 32');
    expect(gasLabel('trimix', 18, 45)).toBe('Trimix 18/45');
    expect(modeLabel('sidemount')).toBe('Sidemount');
    expect(modeLabel('other')).toBe('other');
    expect(pluralize(1, 'dive')).toBe('1 dive');
    expect(pluralize(3, 'dive')).toBe('3 dives');
  });
});
