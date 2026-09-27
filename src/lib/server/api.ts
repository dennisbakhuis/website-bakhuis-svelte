import { error, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// The SvelteKit server talks to FastAPI directly over the compose network
// (or localhost in dev). The browser never sees BACKEND_URL — it uses the
// same-origin /api/* path that Vite (dev) or Caddy (prod) proxies.
export function backendUrl(): string {
  return (env.BACKEND_URL ?? 'http://localhost:8300').replace(/\/$/, '');
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Fetch = typeof fetch;

/**
 * Fetch JSON from the backend. Forwards the caller's cookie so admin routes
 * authenticate with the same session the browser holds.
 */
export async function api<T>(
  fetchFn: Fetch,
  path: string,
  init: RequestInit & { cookie?: string | null } = {},
): Promise<T> {
  const { cookie, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('accept', 'application/json');
  if (cookie) headers.set('cookie', cookie);
  const response = await fetchFn(`${backendUrl()}${path}`, { ...rest, headers });
  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // non-JSON error body — keep the status text
    }
    throw new ApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Load-function helper: turn backend errors into SvelteKit errors. */
export async function apiOrError<T>(event: RequestEvent, path: string): Promise<T> {
  try {
    return await api<T>(event.fetch, path, { cookie: event.request.headers.get('cookie') });
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 404) error(404, 'Not found');
      if (err.status === 401) error(401, 'Not signed in');
      error(502, `Backend error: ${err.message}`);
    }
    error(502, 'Backend unreachable');
  }
}
