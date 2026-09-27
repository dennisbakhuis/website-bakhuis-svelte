import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { BACKEND_URL: 'http://backend:8000/' } }));

import { api, ApiError, backendUrl } from './api';

function response(status: number, body: unknown, json = true): Response {
  return new Response(json ? JSON.stringify(body) : String(body), {
    status,
    headers: json ? { 'content-type': 'application/json' } : {},
  });
}

describe('api', () => {
  afterEach(() => vi.restoreAllMocks());

  it('strips the trailing slash from BACKEND_URL', () => {
    expect(backendUrl()).toBe('http://backend:8000');
  });

  it('forwards the cookie and parses JSON', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(200, { ok: 1 }));
    const result = await api<{ ok: number }>(fetchFn, '/api/v1/x', { cookie: 'a=b' });
    expect(result).toEqual({ ok: 1 });
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://backend:8000/api/v1/x');
    expect(new Headers(init.headers).get('cookie')).toBe('a=b');
    expect(new Headers(init.headers).get('accept')).toBe('application/json');
  });

  it('returns undefined on 204', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    expect(await api(fetchFn, '/x')).toBeUndefined();
  });

  it('raises ApiError with the backend detail', async () => {
    const fetchFn = vi.fn().mockResolvedValue(response(404, { detail: 'Dive not found' }));
    await expect(api(fetchFn, '/x')).rejects.toMatchObject({
      status: 404,
      message: 'Dive not found',
    });
  });

  it('falls back to the status text on non-JSON errors', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response('boom', { status: 502, statusText: 'Bad Gateway' }));
    const err = await api(fetchFn, '/x').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).message).toBe('Bad Gateway');
  });
});
