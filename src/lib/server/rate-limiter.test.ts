import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

const { isLimitedRaw, envMock } = vi.hoisted(() => {
  const isLimitedRaw = vi.fn();
  const envMock: Record<string, string | undefined> = {};
  return { isLimitedRaw, envMock };
});

vi.mock('sveltekit-rate-limiter/server', () => ({
  RateLimiter: class {
    isLimited(...args: unknown[]) {
      return isLimitedRaw(...args);
    }
  },
}));

vi.mock('$env/dynamic/private', () => ({ env: envMock }));

import { contactLimiter } from './rate-limiter';

const event = {} as RequestEvent;

beforeEach(() => {
  for (const key of Object.keys(envMock)) delete envMock[key];
  isLimitedRaw.mockReset().mockResolvedValue(true);
});

describe('contactLimiter', () => {
  it('delegates to the underlying rate limiter', async () => {
    await expect(contactLimiter.isLimited(event)).resolves.toBe(true);
    expect(isLimitedRaw).toHaveBeenCalledWith(event);

    isLimitedRaw.mockResolvedValue(false);
    await expect(contactLimiter.isLimited(event)).resolves.toBe(false);
  });

  it('never limits when E2E_DISABLE_RATE_LIMITER is true', async () => {
    envMock.E2E_DISABLE_RATE_LIMITER = 'true';

    await expect(contactLimiter.isLimited(event)).resolves.toBe(false);
    expect(isLimitedRaw).not.toHaveBeenCalled();
  });
});
