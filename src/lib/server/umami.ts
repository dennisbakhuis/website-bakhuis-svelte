import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import { isbot } from 'isbot';

export type UmamiEvent = {
  // Omit for pageviews — Umami v2 routes events without `name` to the
  // pageview table (event_type=1, counted in Visitors/Visits/Views).
  // Set a string for custom events (event_type=2, Events panel only).
  name?: string;
  url: string;
  hostname: string;
  referrer?: string;
  userAgent: string;
  ip?: string;
  data?: Record<string, string | number | boolean>;
};

const debugEnabled = (env.UMAMI_DEBUG ?? '').toLowerCase() === 'true';

if (!building) {
  if (env.UMAMI_API_URL) {
    if (!env.UMAMI_WEBSITE_ID) {
      console.warn(
        'UMAMI_API_URL is set but UMAMI_WEBSITE_ID is empty — events will be rejected by Umami.',
      );
    } else {
      console.info(`umami tracking enabled (server-side) → ${env.UMAMI_API_URL}`);
    }
  } else {
    console.info('umami tracking disabled (UMAMI_API_URL not set)');
  }
}

/** Hostname of a referrer URL, or '' when absent or unparseable. */
export function referrerHost(referrer: string | undefined): string {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname;
  } catch {
    return '';
  }
}

/**
 * Sends an event to the Umami analytics API.
 *
 * Silent no-op when UMAMI_API_URL is unset. Bot user agents are filtered,
 * and the call never throws or rejects — analytics must not be able to fail
 * a page render. Set UMAMI_DEBUG=true to log every POST result.
 */
export async function trackEvent(event: UmamiEvent): Promise<void> {
  const apiUrl = env.UMAMI_API_URL;
  if (!apiUrl) return;

  if (isbot(event.userAgent)) return;

  // 5000, not the 1500 this started life with: the Umami instance runs on a
  // separate host, and under concurrency its response time rises from ~300ms
  // to ~1s with a measured worst case of 1.8s. The tighter ceiling aborted
  // requests that would have succeeded — 12 of 13 during a burst, and ~1.8%
  // of events on a sibling site's steady traffic. Nothing awaits this call,
  // so a generous ceiling only ever costs a briefly held socket.
  const timeoutMs = parseInt(env.UMAMI_TIMEOUT_MS ?? '5000', 10);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload = {
    type: 'event',
    payload: {
      website: env.UMAMI_WEBSITE_ID ?? '',
      ...(event.name ? { name: event.name } : {}),
      url: event.url,
      hostname: event.hostname,
      language: 'nl',
      referrer: event.referrer ?? '',
      ...(event.data ? { data: event.data } : {}),
      // payload.ip overrides Umami's header-based IP detection (checked
      // before x-forwarded-for), so visitor geolocation reflects the client
      // rather than this server — headers get rewritten by any reverse proxy
      // in front of the Umami instance.
      ...(event.ip ? { ip: event.ip } : {}),
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': event.userAgent,
  };

  // Kept for older Umami versions that lack payload.ip support.
  if (event.ip) {
    headers['X-Forwarded-For'] = event.ip;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (debugEnabled) {
      console.info(
        `umami event posted: ${event.name ?? 'pageview'} ${event.url} → ${response.status}`,
      );
    }
  } catch (err) {
    if (debugEnabled) {
      console.info(`umami event post failed: ${event.name ?? 'pageview'} ${event.url}`, err);
    }
  } finally {
    clearTimeout(timer);
  }
}
