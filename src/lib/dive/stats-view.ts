import type { DiveStats, MapSite } from './types';
import { formatHours } from './format';

export type StatTile = { label: string; value: string; note?: string; href?: string };

const NOTABLE: { tag: string; label: string }[] = [
  { tag: 'cave', label: 'Cave dives' },
  { tag: 'scooter', label: 'Scooter dives' },
  { tag: 'wreck', label: 'Wreck dives' },
  { tag: 'night', label: 'Night dives' },
  { tag: 'deep', label: 'Deep dives' },
  { tag: 'sidemount', label: 'Sidemount' },
];

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
    },
  ];
  return tiles;
}

export function notableTiles(stats: DiveStats): StatTile[] {
  const counts = new Map(stats.tags.map((t) => [t.tag, t.count]));
  return NOTABLE.filter((n) => counts.has(n.tag)).map((n) => ({
    label: n.label,
    value: String(counts.get(n.tag)),
    href: `/dive?tag=${n.tag}`,
  }));
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

export function barHeights<T>(items: T[], value: (item: T) => number, max = 100): number[] {
  const top = Math.max(...items.map(value), 1);
  return items.map((i) => Math.round((value(i) / top) * max));
}
