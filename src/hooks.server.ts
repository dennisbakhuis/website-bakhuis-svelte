import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { env } from '$env/dynamic/private';
import { divelog } from '$lib/divelog.server';
import { handleDivelog } from '@divelog/kit/server';
import { trackEvent, referrerHost } from '$lib/server/umami';

// Endpoints that are machinery rather than pages: the container healthcheck,
// crawlers hitting the sitemap and robots, the API proxy and the admin.
const SKIP_TRACKING_PREFIXES = [
  '/health',
  '/sitemap.xml',
  '/robots.txt',
  '/api/',
  '/admin',
  '/media/',
];

function isSkipped(pathname: string): boolean {
  return SKIP_TRACKING_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const handleSite: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/health') {
    return resolve(event);
  }

  const response = await resolve(event);

  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');

  if (isHtml) {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set(
      'Permissions-Policy',
      'camera=(self), microphone=(), geolocation=(), browsing-topics=()',
    );
  }

  if (env.UMAMI_API_URL && isHtml && !isSkipped(pathname)) {
    const userAgent = event.request.headers.get('user-agent') ?? '';
    const referrer = event.request.headers.get('referer') ?? undefined;
    const ip = event.getClientAddress();

    if (response.status >= 200 && response.status < 300 && response.status !== 204) {
      void trackEvent({ url: pathname, hostname: event.url.hostname, referrer, userAgent, ip });
    } else if (response.status === 404) {
      void trackEvent({
        name: '404',
        url: pathname,
        hostname: event.url.hostname,
        referrer,
        userAgent,
        ip,
        data: { referrer_host: referrerHost(referrer) },
      });
    }
  }

  return response;
};

export const handle = sequence(
  handleDivelog(divelog, { skip: (pathname) => pathname === '/health' }),
  handleSite,
);
