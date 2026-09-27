/** Formatting helpers shared by the dive pages and the front-page tile. */

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

export function formatHours(totalMinutes: number): string {
  return `${(totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1)} h`;
}

export function formatDepth(metres: number | null | undefined): string {
  if (metres === null || metres === undefined) return '—';
  return `${metres.toFixed(metres % 1 === 0 ? 0 : 1)} m`;
}

export function formatTemp(celsius: number | null | undefined): string {
  if (celsius === null || celsius === undefined) return '—';
  return `${Math.round(celsius)} °C`;
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}

export function formatLongDate(iso: string): string {
  return longDateFormatter.format(new Date(`${iso}T00:00:00`));
}

export function formatTime(hms: string | null | undefined): string {
  if (!hms) return '';
  return hms.slice(0, 5);
}

/** Regional-indicator flag for an ISO-3166 alpha-2 code; empty for unknowns. */
export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return '';
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function gasLabel(
  gas: string,
  o2: number | null | undefined,
  he: number | null | undefined,
): string {
  if (gas === 'trimix') return `Trimix ${o2 ?? '?'}/${he ?? '?'}`;
  if (gas === 'nitrox') return `Nitrox ${o2 ?? 32}`;
  return 'Air';
}

export function modeLabel(mode: string): string {
  return { OC: 'Open circuit', CCR: 'Rebreather', sidemount: 'Sidemount' }[mode] ?? mode;
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
