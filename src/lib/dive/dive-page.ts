import type { ProfileSample } from './types';
import type { RouteHighlights } from './sitemap';
import { formatDepth } from './format';

const round = (n: number): number => Math.round(n * 10) / 10;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[/,]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Whether the paper log's ticked types say nothing the tags do not already say. */
export function typesRawAddsNothing(typesRaw: string | null | undefined, tags: string[]): boolean {
  if (!typesRaw) return true;
  const known = new Set(tags.map((t) => t.toLowerCase().trim()));
  return tokens(typesRaw).every((t) => known.has(t));
}

export type ProfileSpark = { line: string; area: string };

/**
 * Lay out a depth profile as SVG path data in a `width` × `height` box, the
 * surface on the top edge and the deepest point on the bottom edge.
 */
export function profileSpark(
  samples: ProfileSample[],
  width: number,
  height: number,
  pad = 2,
): ProfileSpark {
  if (samples.length < 2) return { line: '', area: '' };
  const t0 = samples[0].t;
  const span = Math.max(1e-9, samples[samples.length - 1].t - t0);
  const deepest = Math.max(1e-9, ...samples.map((s) => s.d));
  const x = (t: number): number => round(pad + ((t - t0) / span) * (width - pad * 2));
  const y = (d: number): number => round(pad + (Math.max(0, d) / deepest) * (height - pad * 2));
  const points = samples.map((s) => `${x(s.t)} ${y(s.d)}`);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
  const area = `${line} L${x(samples[samples.length - 1].t)} 0 L${x(t0)} 0 Z`;
  return { line, area };
}

/** One line under the map heading: distance, turn point and deepest station, skipping what is unknown. */
export function routeLine(metres: number, highlights: RouteHighlights): string {
  const parts: string[] = [];
  const rounded = Math.round(metres);
  if (rounded > 0) parts.push(`${rounded} m swum`);
  if (highlights.turnedAt) parts.push(`turned at ${highlights.turnedAt}`);
  if (highlights.deepest) {
    parts.push(`deepest ${formatDepth(highlights.deepest.depth)} at ${highlights.deepest.label}`);
  }
  return parts.join(' · ');
}

/** Whether two depths read the same once formatted. */
export function sameDepth(a: number | null, b: number | null): boolean {
  if (a === null || b === null) return a === b;
  return formatDepth(a) === formatDepth(b);
}
