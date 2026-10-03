import { describe, expect, it } from 'vitest';
import { archiveFor, minZoomFor, startZoom, type TileIndex } from './locator';

const index: TileIndex = {
  attribution: '© OpenStreetMap contributors · Protomaps',
  archives: [
    { file: 'benelux.pmtiles', bbox: [3.5, 50.4, 7.0, 52.9], maxzoom: 14 },
    { file: 'zeeland.pmtiles', bbox: [3.6, 51.4, 4.2, 51.8], maxzoom: 15 },
    { file: 'bonaire.pmtiles', bbox: [-68.5, 11.9, -68.1, 12.4], maxzoom: 15 },
  ],
};

describe('archiveFor', () => {
  it('prefers the smallest archive that contains the point', () => {
    expect(archiveFor(index, 51.6, 3.9)?.file).toBe('zeeland.pmtiles');
    expect(archiveFor(index, 52.3, 6.6)?.file).toBe('benelux.pmtiles');
    expect(archiveFor(index, 12.1, -68.3)?.file).toBe('bonaire.pmtiles');
  });

  it('returns null for a point outside every archive', () => {
    expect(archiveFor(index, 27.8, 33.9)).toBeNull();
  });
});

describe('startZoom', () => {
  it('goes closer for small enclosed sites and wider for open water', () => {
    expect(startZoom('pool')).toBeGreaterThan(startZoom('cave'));
    expect(startZoom('cave')).toBeGreaterThan(startZoom('lake'));
    expect(startZoom('lake')).toBeGreaterThan(startZoom('wreck'));
    expect(startZoom('something new')).toBe(14);
  });
});

describe('minZoomFor', () => {
  it('lets a small archive zoom out less than a large one, within limits', () => {
    expect(minZoomFor([3.5, 50.4, 7.0, 52.9])).toBe(6);
    expect(minZoomFor([-68.5, 11.9, -68.1, 12.4])).toBe(9);
    expect(minZoomFor([0, 0, 0.0001, 0.0001])).toBe(12);
    expect(minZoomFor([-180, -85, 180, 85])).toBe(3);
  });
});
