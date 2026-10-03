import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { api, ApiError } from '$lib/server/api';
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

async function resolveOwner(cookie: string | null, fetchFn: typeof fetch): Promise<string | null> {
  if (!cookie) return null;
  try {
    const me = await api<{ email: string }>(fetchFn, '/api/v1/auth/me', { cookie });
    return me.email;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    return null;
  }
}

export const handle: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;

  if (pathname === '/health') {
    return resolve(event);
  }

  // Any page may show the owner's private view, so the cookie is resolved
  // everywhere; a request without one costs nothing.
  event.locals.owner = await resolveOwner(event.request.headers.get('cookie'), event.fetch);
  if (pathname.startsWith('/admin')) {
    const isLogin = pathname.startsWith('/admin/login');
    if (!event.locals.owner && !isLogin) {
      redirect(303, `/admin/login?next=${encodeURIComponent(pathname)}`);
    }
    if (event.locals.owner && isLogin) {
      redirect(303, '/admin');
    }
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
    if (pathname.startsWith('/admin')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    if (event.locals.owner) {
      response.headers.set('Cache-Control', 'private, no-store');
    }
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
