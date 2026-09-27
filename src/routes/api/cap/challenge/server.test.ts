import { beforeEach, describe, expect, it, vi } from 'vitest';

const { generateChallenge, capEnabled } = vi.hoisted(() => ({
  generateChallenge: vi.fn(),
  capEnabled: { value: true },
}));

vi.mock('capjs-core', () => ({
  generateChallenge: (...args: unknown[]) => generateChallenge(...args),
}));

vi.mock('$lib/server/cap', () => ({
  isCapEnabled: () => capEnabled.value,
  getCapSecret: () => 'x'.repeat(32),
}));

import { POST, prerender } from './+server';

type PostEvent = Parameters<typeof POST>[0];

beforeEach(() => {
  capEnabled.value = true;
  generateChallenge.mockReset().mockResolvedValue({ challenge: 'data', token: 'tok' });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/cap/challenge', () => {
  it('is excluded from prerendering', () => {
    expect(prerender).toBe(false);
  });

  it('returns a generated challenge as JSON', async () => {
    const response = await POST({} as PostEvent);

    expect(generateChallenge).toHaveBeenCalledWith('x'.repeat(32));
    expect(await response.json()).toEqual({ challenge: 'data', token: 'tok' });
  });

  it('404s when cap is disabled', async () => {
    capEnabled.value = false;
    await expect(POST({} as PostEvent)).rejects.toMatchObject({ status: 404 });
  });

  it('500s when challenge generation fails', async () => {
    generateChallenge.mockRejectedValue(new Error('boom'));
    await expect(POST({} as PostEvent)).rejects.toMatchObject({ status: 500 });
  });
});
