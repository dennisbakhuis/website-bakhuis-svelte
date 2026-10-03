import type { DiveStats, MapSite } from './types';
import { formatHours } from './format';

/** One stat; `group: false` keeps a counted number like a year free of digit grouping. */
export type StatTile = {
  label: string;
  value: string;
  note?: string;
  href?: string;
  group?: boolean;
};

const NOTABLE: { tag: string; label: string }[] = [
  { tag: 'cave', label: 'Cave dives' },
  { tag: 'dpv', label: 'Scooter dives' },
  { tag: 'wreck', label: 'Wreck dives' },
  { tag: 'deco', label: 'Deco dives' },
  { tag: 'night', label: 'Night dives' },
  { tag: 'drift', label: 'Drift dives' },
];

/** Depth is a field, not a tag: the "deep" tile counts dives at or past this many metres. */
export const DEEP_DIVE_M = 30;

export function headlineTiles(stats: DiveStats): StatTile[] {
  const tiles: StatTile[] = [
    {
      label: 'Dives',
      value: String(stats.total_dives),
      note: stats.private_dives ? `${stats.private_dives} private` : undefined,
    },
    { label: 'Time underwater', value: formatHours(stats.total_minutes) },
    { label: 'Max depth', value: `${stats.max_depth_m} m` },
    { label: 'Countries', value: String(stats.countries) },
    { label: 'Sites', value: String(stats.sites) },
    {
      label: 'Diving since',
      value: stats.first_dive ? stats.first_dive.slice(0, 4) : '—',
      group: false,
    },
  ];
  return tiles;
}

export function notableTiles(stats: DiveStats): StatTile[] {
  const counts = new Map(stats.tags.map((t) => [t.tag, t.count]));
  const tiles: StatTile[] = NOTABLE.filter((n) => counts.has(n.tag)).map((n) => ({
    label: n.label,
    value: String(counts.get(n.tag)),
    href: `/dive?tag=${n.tag}`,
  }));
  if (stats.deep_dives)
    tiles.push({
      label: `Deep dives`,
      value: String(stats.deep_dives),
      note: `${DEEP_DIVE_M} m or more`,
      href: `/dive?min=${DEEP_DIVE_M}`,
    });
  return tiles;
}

export function recordTiles(stats: DiveStats): StatTile[] {
  const tiles: StatTile[] = [];
  if (stats.deepest)
    tiles.push({
      label: 'Deepest',
      value: `${stats.deepest.value} m`,
      note: stats.deepest.site ?? undefined,
      href: `/dive/${stats.deepest.number}`,
    });
  if (stats.longest)
    tiles.push({
      label: 'Longest',
      value: `${stats.longest.value} min`,
      note: stats.longest.site ?? undefined,
      href: `/dive/${stats.longest.number}`,
    });
  if (stats.coldest)
    tiles.push({
      label: 'Coldest',
      value: `${stats.coldest.value} °C`,
      note: stats.coldest.site ?? undefined,
      href: `/dive/${stats.coldest.number}`,
    });
  return tiles;
}

/** Radius for a map dot: sqrt scaling so 10 dives is not 10× the area of 1. */
export function dotRadius(site: MapSite, max: number): number {
  const base = 3;
  const extra = 7;
  return base + extra * Math.sqrt(site.dives / Math.max(max, 1));
}

export type SizeMode = 'dives' | 'minutes' | 'uniform';
export type ColourMode = 'type' | 'year' | 'depth';

/** A change from the map's option strip; keys mirror the URL filter. */
export type MapOptionsPatch = {
  mapSize?: SizeMode;
  mapColour?: ColourMode;
};

export const SIZE_MODES: { mode: SizeMode; label: string }[] = [
  { mode: 'dives', label: 'dives' },
  { mode: 'minutes', label: 'bottom time' },
  { mode: 'uniform', label: 'same size' },
];

export const COLOUR_MODES: { mode: ColourMode; label: string }[] = [
  { mode: 'type', label: 'site type' },
  { mode: 'year', label: 'last visit' },
  { mode: 'depth', label: 'max depth' },
];

/** Dot radius for the chosen measure; `max` is that measure's maximum over the dots. */
export function dotRadiusBy(site: MapSite, mode: SizeMode, max: number): number {
  if (mode === 'uniform') return 4.5;
  const value = mode === 'minutes' ? site.minutes : site.dives;
  return 3 + 7 * Math.sqrt(value / Math.max(max, 1));
}

export function dotMeasureMax(sites: MapSite[], mode: SizeMode): number {
  if (mode === 'minutes') return Math.max(...sites.map((s) => s.minutes), 1);
  return Math.max(...sites.map((s) => s.dives), 1);
}

const TYPE_COLOURS: Record<string, string> = {
  cave: 'var(--tag-cave)',
  cavern: 'var(--tag-cave)',
  mine: 'var(--tag-cave)',
  quarry: 'var(--tag-training)',
  'quarry lake': 'var(--tag-training)',
  lake: 'var(--tag-drift)',
  reservoir: 'var(--tag-drift)',
  pool: 'var(--tag-training)',
  'indoor dive tower': 'var(--tag-training)',
  wreck: 'var(--tag-wreck)',
  'reef with wrecks': 'var(--tag-wreck)',
};

export function typeColour(type: string): string {
  return TYPE_COLOURS[type] ?? 'var(--color-accent)';
}

/** The legend swatches for the type colouring, collapsed to the families that share a colour. */
export const TYPE_LEGEND: { label: string; colour: string }[] = [
  { label: 'sea', colour: 'var(--color-accent)' },
  { label: 'cave', colour: 'var(--tag-cave)' },
  { label: 'quarry / pool', colour: 'var(--tag-training)' },
  { label: 'lake', colour: 'var(--tag-drift)' },
  { label: 'wreck', colour: 'var(--tag-wreck)' },
];

export type ColourScale = { min: number; max: number };

export function colourScale(sites: MapSite[], mode: ColourMode): ColourScale {
  if (mode === 'year') {
    const years = sites.map((s) => s.last_year);
    return { min: Math.min(...years, 3000), max: Math.max(...years, 0) };
  }
  if (mode === 'depth') return { min: 0, max: Math.max(...sites.map((s) => s.max_depth_m), 1) };
  return { min: 0, max: 1 };
}

/** A colour for one dot: a hue ramp for the continuous modes, a token per family otherwise. */
export function dotColour(site: MapSite, mode: ColourMode, scale: ColourScale): string {
  if (mode === 'type') return typeColour(site.site_type);
  const value = mode === 'year' ? site.last_year : site.max_depth_m;
  const span = scale.max - scale.min || 1;
  const t = Math.min(1, Math.max(0, (value - scale.min) / span));
  if (mode === 'year') return `hsl(${200 + 0 * t} ${25 + 60 * t}% ${40 + 25 * t}%)`;
  return `hsl(${196 - 60 * t} 78% ${68 - 36 * t}%)`;
}

export function barHeights<T>(items: T[], value: (item: T) => number, max = 100): number[] {
  const top = Math.max(...items.map(value), 1);
  return items.map((i) => Math.round((value(i) / top) * max));
}

export type MonthTemp = { label: string; month: number; temp: number | null; dives: number };

/** Fewer dives with a water temperature than this and the monthly chart says nothing. */
export const MIN_TEMP_DIVES = 3;

/**
 * Mean water temperature per calendar month over ``dives``, or null when fewer
 * than ``MIN_TEMP_DIVES`` of them logged one. ``dives`` counts the dives with a
 * temperature in that month.
 */
export function waterTempByMonth(
  dives: { date: string; water_temp_c: number | null }[],
): MonthTemp[] | null {
  const months = Array.from({ length: 12 }, () => [] as number[]);
  for (const dive of dives) {
    if (dive.water_temp_c === null) continue;
    months[Number(dive.date.slice(5, 7)) - 1]?.push(dive.water_temp_c);
  }
  if (months.reduce((n, m) => n + m.length, 0) < MIN_TEMP_DIVES) return null;
  return months.map((temps, i) => ({
    label: 'JFMAMJJASOND'[i],
    month: i + 1,
    temp: temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null,
    dives: temps.length,
  }));
}

export type DurationBucket = { label: string; from_min: number; dives: number };

const DURATION_EDGES = [0, 30, 45, 60, 90, 120];

/** Dives per bottom-time band; the last band is open-ended. */
export function durationBuckets(dives: { duration_min: number }[]): DurationBucket[] {
  const buckets = DURATION_EDGES.map((from, i) => ({
    label: i === DURATION_EDGES.length - 1 ? `${from}+` : `${from}–${DURATION_EDGES[i + 1]}`,
    from_min: from,
    dives: 0,
  }));
  for (const dive of dives) {
    const i = DURATION_EDGES.findLastIndex((edge) => dive.duration_min >= edge);
    buckets[Math.max(i, 0)].dives += 1;
  }
  return buckets;
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mostCommon(values: string[]): { value: string; share: number } | null {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const [value, count] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  return { value, share: Math.round((count / values.length) * 100) };
}

export type TypicalDive = {
  date: string;
  time_in: string | null;
  duration_min: number;
  max_depth_m: number;
  water_temp_c: number | null;
  gas: string;
};

const GAS_NAMES: Record<string, string> = { air: 'Air', nitrox: 'Nitrox', trimix: 'Trimix' };

/** The middle-of-the-road dive: medians from the list, with the plain averages as notes. */
export function typicalDive(
  dives: TypicalDive[],
  stats: Pick<DiveStats, 'avg_depth_m' | 'avg_duration_min' | 'total_dives' | 'years'>,
): StatTile[] {
  const tiles: StatTile[] = [];
  const depth = median(dives.map((d) => d.max_depth_m));
  if (depth !== null)
    tiles.push({
      label: 'Depth',
      value: `${Math.round(depth)} m`,
      note: stats.avg_depth_m ? `avg ${Math.round(stats.avg_depth_m)} m` : undefined,
    });
  const duration = median(dives.map((d) => d.duration_min));
  if (duration !== null)
    tiles.push({
      label: 'Bottom time',
      value: `${Math.round(duration)} min`,
      note: stats.avg_duration_min ? `avg ${Math.round(stats.avg_duration_min)} min` : undefined,
    });
  const temps = dives.map((d) => d.water_temp_c).filter((t): t is number => t !== null);
  if (temps.length)
    tiles.push({
      label: 'Water',
      value: `${Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)} °C`,
      note: `${Math.min(...temps)}–${Math.max(...temps)} °C`,
    });
  const activeYears = stats.years.filter((y) => y.dives > 0).length;
  if (activeYears)
    tiles.push({
      label: 'Per year',
      value: `${Math.round(stats.total_dives / activeYears)} dives`,
      note: `over ${activeYears} ${activeYears === 1 ? 'year' : 'years'}`,
    });
  const gas = mostCommon(dives.map((d) => d.gas));
  if (gas)
    tiles.push({
      label: 'Usual gas',
      value: GAS_NAMES[gas.value] ?? gas.value,
      note: `${gas.share}% of dives`,
    });
  const starts = dives
    .map((d) => d.time_in)
    .filter((t): t is string => !!t)
    .map((t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)));
  const start = median(starts);
  if (start !== null) {
    const h = Math.floor(start / 60);
    const m = Math.round(start % 60);
    tiles.push({
      label: 'Usual start',
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      note: `${starts.length} with a time`,
    });
  }
  return tiles;
}
