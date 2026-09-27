import type { DiveListItem } from './types';

export type SortKey = 'date' | 'depth' | 'duration' | 'number';

export type DiveFilter = {
  q: string;
  tags: string[];
  country: string;
  site: string;
  year: number | null;
  gas: string;
  mode: string;
  setup: string;
  minDepth: number | null;
  maxDepth: number | null;
  sort: SortKey;
  desc: boolean;
};

export const EMPTY_FILTER: DiveFilter = {
  q: '',
  tags: [],
  country: '',
  site: '',
  year: null,
  gas: '',
  mode: '',
  setup: '',
  minDepth: null,
  maxDepth: null,
  sort: 'date',
  desc: true,
};

function num(value: string | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Read a filter from the URL so a filtered view can be shared. */
export function filterFromParams(params: URLSearchParams): DiveFilter {
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    tags: (params.get('tag') ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    country: params.get('country') ?? '',
    site: params.get('site') ?? '',
    year: num(params.get('year')),
    gas: params.get('gas') ?? '',
    mode: params.get('mode') ?? '',
    setup: params.get('setup') ?? '',
    minDepth: num(params.get('min')),
    maxDepth: num(params.get('max')),
    sort: sort === 'depth' || sort === 'duration' || sort === 'number' ? sort : 'date',
    desc: params.get('asc') !== '1',
  };
}

export function filterToParams(filter: DiveFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.q) params.set('q', filter.q);
  if (filter.tags.length) params.set('tag', filter.tags.join(','));
  if (filter.country) params.set('country', filter.country);
  if (filter.site) params.set('site', filter.site);
  if (filter.year !== null) params.set('year', String(filter.year));
  if (filter.gas) params.set('gas', filter.gas);
  if (filter.mode) params.set('mode', filter.mode);
  if (filter.setup) params.set('setup', filter.setup);
  if (filter.minDepth !== null) params.set('min', String(filter.minDepth));
  if (filter.maxDepth !== null) params.set('max', String(filter.maxDepth));
  if (filter.sort !== 'date') params.set('sort', filter.sort);
  if (!filter.desc) params.set('asc', '1');
  return params;
}

export function isFilterActive(filter: DiveFilter): boolean {
  return filterToParams({ ...filter, sort: 'date', desc: true }).toString() !== '';
}

function haystack(dive: DiveListItem): string {
  return [
    dive.title,
    String(dive.number),
    dive.site?.name,
    dive.site?.country_name,
    dive.site?.region,
    ...dive.buddies,
    ...dive.tags,
    dive.gas,
    dive.mode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function applyFilter(dives: DiveListItem[], filter: DiveFilter): DiveListItem[] {
  const terms = filter.q.toLowerCase().split(/\s+/).filter(Boolean);
  const result = dives.filter((dive) => {
    if (terms.length) {
      const hay = haystack(dive);
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    if (filter.tags.length && !filter.tags.every((t) => dive.tags.includes(t))) return false;
    if (filter.country && dive.site?.country_code !== filter.country) return false;
    if (filter.site && dive.site?.slug !== filter.site) return false;
    if (filter.year !== null && !dive.date.startsWith(`${filter.year}-`)) return false;
    if (filter.gas && dive.gas !== filter.gas) return false;
    if (filter.mode && dive.mode !== filter.mode) return false;
    if (filter.setup && dive.gear_setup !== filter.setup) return false;
    if (filter.minDepth !== null && dive.max_depth_m < filter.minDepth) return false;
    if (filter.maxDepth !== null && dive.max_depth_m > filter.maxDepth) return false;
    return true;
  });

  const key = {
    date: (d: DiveListItem) => `${d.date}#${String(d.number).padStart(6, '0')}`,
    depth: (d: DiveListItem) => d.max_depth_m,
    duration: (d: DiveListItem) => d.duration_min,
    number: (d: DiveListItem) => d.number,
  }[filter.sort];

  result.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const cmp = ka < kb ? -1 : ka > kb ? 1 : 0;
    return filter.desc ? -cmp : cmp;
  });
  return result;
}

export function toggleTag(filter: DiveFilter, tag: string): DiveFilter {
  const tags = filter.tags.includes(tag)
    ? filter.tags.filter((t) => t !== tag)
    : [...filter.tags, tag];
  return { ...filter, tags };
}
