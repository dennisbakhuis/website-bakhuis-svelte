import { beforeEach, describe, expect, it, vi } from 'vitest';

const { validateChallenge, storeToken, capEnabled } = vi.hoisted(() => ({
  validateChallenge: vi.fn(),
  storeToken: vi.fn(),
  capEnabled: { value: true },
}));

vi.mock('capjs-core', () => ({
  validateChallenge: (...args: unknown[]) => validateChallenge(...args),
}));

vi.mock('$lib/server/cap', () => ({
  isCapEnabled: () => capEnabled.value,
  getCapSecret: () => 'x'.repeat(32),
}));

vi.mock('$lib/server/cap-store', () => ({
  consumeNonce: vi.fn(),
  storeToken: (...args: unknown[]) => storeToken(...args),
}));

import { POST, prerender } from './+server';

type PostEvent = Parameters<typeof POST>[0];

function makeEvent(body: unknown): PostEvent {
  return {
    request: new Request('http://localhost/api/cap/redeem', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  } as PostEvent;
}

beforeEach(() => {
  capEnabled.value = true;
  storeToken.mockReset();
  validateChallenge
    .mockReset()
    .mockResolvedValue({ success: true, token: 'tok', tokenKey: 'key', expires: 123 });
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('POST /api/cap/redeem', () => {
  it('is excluded from prerendering', () => {
    expect(prerender).toBe(false);
  });

  it('stores the token and returns success for a valid redeem', async () => {
    const response = await POST(makeEvent({ token: 'ch-token', solutions: [1, 2, 3] }));

    expect(storeToken).toHaveBeenCalledWith('key', 123);
    expect(await response.json()).toEqual({ success: true, token: 'tok', expires: 123 });
  });

  it('returns 400 with the reason when validation fails', async () => {
    validateChallenge.mockResolvedValue({ success: false, reason: 'invalid_solutions' });

    const response = await POST(makeEvent({ token: 'ch-token', solutions: [] }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ success: false, reason: 'invalid_solutions' });
    expect(storeToken).not.toHaveBeenCalled();
  });

  it('404s when cap is disabled', async () => {
    capEnabled.value = false;
    await expect(POST(makeEvent({ token: 't', solutions: [] }))).rejects.toMatchObject({
      status: 404,
    });
  });

  it('400s on a non-JSON body', async () => {
    await expect(POST(makeEvent('not json'))).rejects.toMatchObject({ status: 400 });
  });

  it('400s when token or solutions are missing', async () => {
    await expect(POST(makeEvent({ token: 't' }))).rejects.toMatchObject({ status: 400 });
    await expect(POST(makeEvent({ solutions: [] }))).rejects.toMatchObject({ status: 400 });
  });
});
