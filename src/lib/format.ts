/** Date formatting for the site's own pages (blog, home). */

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
