import { describe, expect, it } from 'vitest';
import {
  applyFilter,
  EMPTY_FILTER,
  filterFromParams,
  filterToParams,
  isFilterActive,
  toggleTag,
} from './filter';
import type { DiveListItem } from './types';

function dive(overrides: Partial<DiveListItem>): DiveListItem {
  return {
    number: 1,
    title: '',
    date: '2024-01-01',
    duration_min: 45,
    max_depth_m: 20,
    water_temp_c: 12,
    tags: [],
    gas: 'air',
    mode: 'OC',
    site: {
      slug: 'zeelandbrug',
      name: 'Zeelandbrug',
      country_code: 'NL',
      country_name: 'Netherlands',
      region: 'Zeeland',
      lat: 1,
      lon: 2,
      site_type: 'sea',
    },
    buddies: ['Kim'],
    gear_setup: 'backmount-cold',
    rating: 4,
    has_photos: false,
    cover_url: null,
    ...overrides,
  };
}

const dives = [
  dive({ number: 1, date: '2023-05-01', max_depth_m: 12, tags: ['training'] }),
  dive({
    number: 2,
    date: '2024-05-08',
    max_depth_m: 40,
    duration_min: 90,
    tags: ['cave', 'scooter'],
    gas: 'nitrox',
    mode: 'sidemount',
    gear_setup: 'sidemount-cave-dpv',
    site: {
      slug: 'ressel',
      name: 'Ressel',
      country_code: 'FR',
      country_name: 'France',
      region: 'Lot',
      lat: 1,
      lon: 2,
      site_type: 'cave',
    },
  }),
  dive({ number: 3, date: '2024-05-08', max_depth_m: 30, tags: ['wreck'], buddies: ['Mark'] }),
];

describe('applyFilter', () => {
  it('sorts by date descending by default with number as tiebreaker', () => {
    expect(applyFilter(dives, EMPTY_FILTER).map((d) => d.number)).toEqual([3, 2, 1]);
  });

  it('searches across site, buddies and tags', () => {
    expect(applyFilter(dives, { ...EMPTY_FILTER, q: 'ressel' }).map((d) => d.number)).toEqual([2]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, q: 'mark' }).map((d) => d.number)).toEqual([3]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, q: 'france cave' }).map((d) => d.number)).toEqual([
      2,
    ]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, q: 'nothing' })).toEqual([]);
  });

  it('applies facets', () => {
    expect(applyFilter(dives, { ...EMPTY_FILTER, tags: ['cave'] }).map((d) => d.number)).toEqual([
      2,
    ]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, country: 'NL' }).map((d) => d.number)).toEqual([
      3, 1,
    ]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, year: 2024 }).map((d) => d.number)).toEqual([
      3, 2,
    ]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, gas: 'nitrox' }).map((d) => d.number)).toEqual([
      2,
    ]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, mode: 'sidemount' }).map((d) => d.number)).toEqual(
      [2],
    );
    expect(
      applyFilter(dives, { ...EMPTY_FILTER, setup: 'backmount-cold' }).map((d) => d.number),
    ).toEqual([3, 1]);
    expect(applyFilter(dives, { ...EMPTY_FILTER, site: 'ressel' }).map((d) => d.number)).toEqual([
      2,
    ]);
    expect(
      applyFilter(dives, { ...EMPTY_FILTER, minDepth: 25, maxDepth: 35 }).map((d) => d.number),
    ).toEqual([3]);
  });

  it('sorts by depth and duration', () => {
    expect(applyFilter(dives, { ...EMPTY_FILTER, sort: 'depth' }).map((d) => d.number)).toEqual([
      2, 3, 1,
    ]);
    expect(
      applyFilter(dives, { ...EMPTY_FILTER, sort: 'duration', desc: false }).map((d) => d.number),
    ).toEqual([1, 3, 2]);
    expect(
      applyFilter(dives, { ...EMPTY_FILTER, sort: 'number', desc: false }).map((d) => d.number),
    ).toEqual([1, 2, 3]);
  });
});

describe('URL round-trip', () => {
  it('serialises only the non-default fields', () => {
    const filter = {
      ...EMPTY_FILTER,
      q: 'cave',
      tags: ['cave', 'scooter'],
      year: 2024,
      sort: 'depth' as const,
      desc: false,
      minDepth: 10,
    };
    const params = filterToParams(filter);
    expect(params.toString()).toBe('q=cave&tag=cave%2Cscooter&year=2024&min=10&sort=depth&asc=1');
    expect(filterFromParams(params)).toEqual(filter);
    expect(filterToParams(EMPTY_FILTER).toString()).toBe('');
  });

  it('ignores garbage values', () => {
    const filter = filterFromParams(new URLSearchParams('year=abc&sort=nope&min=&tag=,,'));
    expect(filter.year).toBeNull();
    expect(filter.sort).toBe('date');
    expect(filter.minDepth).toBeNull();
    expect(filter.tags).toEqual([]);
  });

  it('knows when a filter is active', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, sort: 'depth' })).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, country: 'NL' })).toBe(true);
  });

  it('toggles tags', () => {
    const on = toggleTag(EMPTY_FILTER, 'cave');
    expect(on.tags).toEqual(['cave']);
    expect(toggleTag(on, 'cave').tags).toEqual([]);
  });
});
