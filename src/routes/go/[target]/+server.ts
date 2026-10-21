import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { GO_TARGETS, isGoTarget } from '$lib/go-targets';
import { trackEvent, referrerHost } from '$lib/server/umami';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = (event) => {
  const target = event.params.target ?? '';

  if (!isGoTarget(target)) {
    redirect(302, '/contact');
  }

  const { href, event: eventName } = GO_TARGETS[target];

  if (env.UMAMI_API_URL) {
    const referrer = event.request.headers.get('referer') ?? undefined;
    void trackEvent({
      name: eventName,
      url: `/go/${target}`,
      hostname: event.url.hostname,
      referrer,
      userAgent: event.request.headers.get('user-agent') ?? '',
      ip: event.getClientAddress(),
      data: {
        target,
        from: event.url.searchParams.get('from') ?? 'unknown',
        referrer_host: referrerHost(referrer),
      },
    });
  }

  redirect(302, href);
};
