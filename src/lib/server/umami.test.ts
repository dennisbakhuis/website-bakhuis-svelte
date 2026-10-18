import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const privateEnv: Record<string, string | undefined> = {};

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));
vi.mock('$app/environment', () => ({ building: false }));

const API_URL = 'https://umami.example.com/api/send';
const WEBSITE_ID = '00000000-0000-4000-8000-000000000000';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

const fetchMock = vi.fn();

/** Import a fresh copy of the module so the boot-time env read re-runs. */
async function loadModule() {
  vi.resetModules();
  return import('./umami');
}

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    init,
    headers: init.headers as Record<string, string>,
    body: JSON.parse(init.body as string),
  };
}

beforeEach(() => {
  for (const key of Object.keys(privateEnv)) delete privateEnv[key];
  privateEnv.UMAMI_API_URL = API_URL;
  privateEnv.UMAMI_WEBSITE_ID = WEBSITE_ID;

  fetchMock.mockReset().mockResolvedValue({ status: 200, ok: true } as Response);
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('referrerHost', () => {
  it('extracts the hostname from a referrer URL', async () => {
    const { referrerHost } = await loadModule();
    expect(referrerHost('https://www.google.com/search?q=diving')).toBe('www.google.com');
  });

  it('returns an empty string for missing or unparseable referrers', async () => {
    const { referrerHost } = await loadModule();
    expect(referrerHost(undefined)).toBe('');
    expect(referrerHost('not-a-url')).toBe('');
  });
});

describe('trackEvent', () => {
  it('does nothing when UMAMI_API_URL is unset', async () => {
    delete privateEnv.UMAMI_API_URL;
    const { trackEvent } = await loadModule();

    await trackEvent({ url: '/', hostname: 'dennisbakhuis.nl', userAgent: BROWSER_UA });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts a pageview without a name field', async () => {
    const { trackEvent } = await loadModule();

    await trackEvent({
      url: '/projecten',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
      referrer: 'https://www.google.com/',
    });

    const { url, init, body } = lastRequest();
    expect(url).toBe(API_URL);
    expect(init.method).toBe('POST');
    expect(body.type).toBe('event');
    expect(body.payload).toMatchObject({
      website: WEBSITE_ID,
      url: '/projecten',
      hostname: 'dennisbakhuis.nl',
      language: 'nl',
      referrer: 'https://www.google.com/',
    });
    expect(body.payload).not.toHaveProperty('name');
  });

  it('posts a named custom event with its data payload', async () => {
    const { trackEvent } = await loadModule();

    await trackEvent({
      name: 'phone_click',
      url: '/go/bellen',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
      data: { from: 'header' },
    });

    expect(lastRequest().body.payload).toMatchObject({
      name: 'phone_click',
      data: { from: 'header' },
    });
  });

  it('sends the visitor IP both as payload.ip and X-Forwarded-For', async () => {
    const { trackEvent } = await loadModule();

    await trackEvent({
      url: '/',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
      ip: '203.0.113.7',
    });

    const { body, headers } = lastRequest();
    expect(body.payload.ip).toBe('203.0.113.7');
    expect(headers['X-Forwarded-For']).toBe('203.0.113.7');
    expect(headers['User-Agent']).toBe(BROWSER_UA);
  });

  it('omits the IP fields entirely when no address is supplied', async () => {
    const { trackEvent } = await loadModule();

    await trackEvent({ url: '/', hostname: 'dennisbakhuis.nl', userAgent: BROWSER_UA });

    const { body, headers } = lastRequest();
    expect(body.payload).not.toHaveProperty('ip');
    expect(headers).not.toHaveProperty('X-Forwarded-For');
  });

  it('drops events from bot user agents', async () => {
    const { trackEvent } = await loadModule();

    await trackEvent({
      url: '/',
      hostname: 'dennisbakhuis.nl',
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never rejects when the Umami instance is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const { trackEvent } = await loadModule();

    await expect(
      trackEvent({ url: '/', hostname: 'dennisbakhuis.nl', userAgent: BROWSER_UA }),
    ).resolves.toBeUndefined();
  });

  it('defaults the timeout to 5000ms when UMAMI_TIMEOUT_MS is unset', async () => {
    vi.useFakeTimers();
    delete privateEnv.UMAMI_TIMEOUT_MS;

    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      capturedSignal = init.signal ?? undefined;
      return new Promise((resolve) => {
        init.signal?.addEventListener('abort', () => resolve({ status: 0, ok: false } as Response));
      });
    });

    const { trackEvent } = await loadModule();
    const pending = trackEvent({
      url: '/',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
    });

    await vi.advanceTimersByTimeAsync(4900);
    expect(capturedSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(200);
    expect(capturedSignal?.aborted).toBe(true);

    await pending;
    vi.useRealTimers();
  });

  it('aborts the request once UMAMI_TIMEOUT_MS elapses', async () => {
    vi.useFakeTimers();
    privateEnv.UMAMI_TIMEOUT_MS = '50';

    let capturedSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_url: string, init: RequestInit) => {
      capturedSignal = init.signal ?? undefined;
      return new Promise((resolve) => {
        init.signal?.addEventListener('abort', () => resolve({ status: 0, ok: false } as Response));
      });
    });

    const { trackEvent } = await loadModule();
    const pending = trackEvent({
      url: '/',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
    });

    expect(capturedSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(60);
    expect(capturedSignal?.aborted).toBe(true);

    await pending;
    vi.useRealTimers();
  });

  it('logs each post when UMAMI_DEBUG is on', async () => {
    privateEnv.UMAMI_DEBUG = 'true';
    const { trackEvent } = await loadModule();

    await trackEvent({
      name: 'phone_click',
      url: '/go/bellen',
      hostname: 'dennisbakhuis.nl',
      userAgent: BROWSER_UA,
    });

    expect(console.info).toHaveBeenCalledWith(expect.stringContaining('phone_click /go/bellen'));
  });

  it('logs the failure when UMAMI_DEBUG is on and the post breaks', async () => {
    privateEnv.UMAMI_DEBUG = 'true';
    const failure = new Error('ECONNREFUSED');
    fetchMock.mockRejectedValue(failure);
    const { trackEvent } = await loadModule();

    await trackEvent({ url: '/', hostname: 'dennisbakhuis.nl', userAgent: BROWSER_UA });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('umami event post failed: pageview /'),
      failure,
    );
  });

  it('warns at boot when the website id is missing', async () => {
    delete privateEnv.UMAMI_WEBSITE_ID;
    await loadModule();

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('UMAMI_WEBSITE_ID'));
  });
});
