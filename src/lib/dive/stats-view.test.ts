import { describe, expect, it } from 'vitest';
import { barHeights, dotRadius, headlineTiles, notableTiles, recordTiles } from './stats-view';
import type { DiveStats } from './types';

const stats: DiveStats = {
  total_dives: 45,
  private_dives: 1,
  total_minutes: 150,
  max_depth_m: 42,
  avg_depth_m: 20,
  avg_duration_min: 50,
  countries: 6,
  sites: 15,
  first_dive: '2017-07-15',
  last_dive: '2026-05-01',
  tags: [
    { tag: 'cave', count: 9 },
    { tag: 'scooter', count: 4 },
  ],
  years: [],
  country_breakdown: [],
  depth_buckets: [],
  map_sites: [],
  deepest: { number: 30, title: '', value: 42, site: 'Ressel' },
  longest: { number: 30, title: '', value: 96, site: 'Ressel' },
  coldest: null,
};

describe('stats view', () => {
  it('builds headline tiles', () => {
    const tiles = headlineTiles(stats);
    expect(tiles[0]).toEqual({ label: 'Dives', value: '45', note: '1 private' });
    expect(tiles[1].value).toBe('2.5 h');
    expect(tiles[5].value).toBe('2017');
  });

  it('only lists notable tags that exist', () => {
    expect(notableTiles(stats).map((t) => t.label)).toEqual(['Cave dives', 'Scooter dives']);
    expect(notableTiles(stats)[0].href).toBe('/dive?tag=cave');
  });

  it('skips missing records', () => {
    const tiles = recordTiles(stats);
    expect(tiles.map((t) => t.label)).toEqual(['Deepest', 'Longest']);
    expect(tiles[0].href).toBe('/dive/30');
  });

  it('scales dots and bars', () => {
    const site = {
      slug: 's',
      name: 's',
      country_code: 'NL',
      lat: 0,
      lon: 0,
      dives: 4,
      site_type: 'sea',
      max_depth_m: 0,
    };
    expect(dotRadius(site, 4)).toBe(10);
    expect(dotRadius({ ...site, dives: 1 }, 4)).toBe(6.5);
    expect(barHeights([1, 2, 4], (v) => v)).toEqual([25, 50, 100]);
    expect(barHeights([0, 0], (v) => v)).toEqual([0, 0]);
  });
});

describe('stats view edge cases', () => {
  it('omits the private note and handles missing first dive', () => {
    const tiles = headlineTiles({ ...stats, private_dives: 0, first_dive: null });
    expect(tiles[0].note).toBeUndefined();
    expect(tiles[5].value).toBe('—');
  });

  it('renders coldest and records without a site', () => {
    const tiles = recordTiles({
      ...stats,
      deepest: { number: 1, title: '', value: 10, site: null },
      longest: null,
      coldest: { number: 2, title: '', value: 4, site: null },
    });
    expect(tiles.map((t) => t.label)).toEqual(['Deepest', 'Coldest']);
    expect(tiles[0].note).toBeUndefined();
    expect(tiles[1].value).toBe('4 °C');
  });
});
