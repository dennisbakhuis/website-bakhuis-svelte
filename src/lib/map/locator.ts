/**
 * Helpers for the per-site locator map: which self-hosted tile archive covers a
 * point, how far in to start for a given kind of site, and the map colours.
 */
import { DARK, type Flavor } from '@protomaps/basemaps';

export type TileArchive = {
  file: string;
  /** [minlon, minlat, maxlon, maxlat] */
  bbox: [number, number, number, number];
  maxzoom: number;
};

export type TileIndex = {
  attribution: string;
  /** The low-zoom planet archive behind the globe; absent until `make tiles` has cut it. */
  world?: { file: string; maxzoom: number };
  archives: TileArchive[];
};

export const TILES_BASE = '/media/tiles';

/** The smallest archive whose bounds contain the point, or null when none does. */
export function archiveFor(index: TileIndex, lat: number, lon: number): TileArchive | null {
  const covering = index.archives.filter(
    ({ bbox: [w, s, e, n] }) => lon >= w && lon <= e && lat >= s && lat <= n,
  );
  covering.sort((a, b) => area(a.bbox) - area(b.bbox));
  return covering[0] ?? null;
}

function area([w, s, e, n]: TileArchive['bbox']): number {
  return (e - w) * (n - s);
}

/** Initial zoom: a pool fills the frame, an offshore wreck needs the coastline for context. */
export function startZoom(siteType: string): number {
  switch (siteType) {
    case 'pool':
    case 'indoor dive tower':
      return 16;
    case 'cave':
    case 'cavern':
    case 'mine':
      return 15;
    case 'sea':
    case 'wreck':
    case 'reef with wrecks':
      return 13;
    default:
      return 14;
  }
}

/** The zoom at which an archive's bounds roughly fill a viewport; zooming out further shows nothing. */
export function minZoomFor([w, , e]: TileArchive['bbox']): number {
  const zoom = Math.floor(Math.log2(360 / Math.max(e - w, 1e-6)));
  return Math.min(12, Math.max(3, zoom));
}

/** The Protomaps dark flavor recoloured to the site's deep-water palette. */
export function siteFlavor(): Flavor {
  return {
    ...DARK,
    background: '#0a1a30',
    earth: '#132a47',
    water: '#0a1a30',
    park_a: '#153351',
    park_b: '#173856',
    wood_a: '#12304a',
    wood_b: '#14344f',
    scrub_a: '#142f4b',
    scrub_b: '#163350',
    glacier: '#1d3a5a',
    sand: '#1c3350',
    beach: '#1e3552',
    buildings: '#1d3a5a',
    pedestrian: '#17324e',
    pier: '#243f5c',
    minor_service_casing: '#0a1a30',
    minor_casing: '#0a1a30',
    link_casing: '#0a1a30',
    major_casing_early: '#0a1a30',
    major_casing_late: '#0a1a30',
    highway_casing_early: '#0a1a30',
    highway_casing_late: '#0a1a30',
    other: '#2a4665',
    minor_service: '#2a4665',
    minor_a: '#2c4a6a',
    minor_b: '#2f4e6f',
    link: '#385a7d',
    major: '#3f6488',
    highway: '#4a7297',
    railway: '#1d3a5a',
    bridges_other: '#2a4665',
    bridges_minor: '#2f4e6f',
    bridges_link: '#385a7d',
    bridges_major: '#3f6488',
    bridges_highway: '#4a7297',
    boundaries: '#3d5a7a',
    ocean_label: '#5f8fb5',
    city_label: '#d6e2f0',
    city_label_halo: '#0a1a30',
    subplace_label: '#a9bbd0',
    subplace_label_halo: '#0a1a30',
    roads_label_minor: '#8a9db5',
    roads_label_minor_halo: '#0a1a30',
    roads_label_major: '#a9bbd0',
    roads_label_major_halo: '#0a1a30',
    state_label: '#6f86a3',
    state_label_halo: '#0a1a30',
    country_label: '#8a9db5',
    address_label: '#6f86a3',
    address_label_halo: '#0a1a30',
    landcover: {
      grassland: 'rgba(21, 51, 81, 1)',
      barren: 'rgba(28, 51, 80, 1)',
      urban_area: 'rgba(29, 58, 90, 1)',
      farmland: 'rgba(20, 47, 75, 1)',
      glacier: 'rgba(29, 58, 90, 1)',
      scrub: 'rgba(22, 51, 80, 1)',
      forest: 'rgba(18, 48, 74, 1)',
    },
  };
}
