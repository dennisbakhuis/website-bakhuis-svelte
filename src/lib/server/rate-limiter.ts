import { RateLimiter, type Rate } from 'sveltekit-rate-limiter/server';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const FORM_LIMIT_PER_IP: Rate = [5, '10m'];

const rawContactLimiter = new RateLimiter({ IP: FORM_LIMIT_PER_IP });

export type Limiter = { isLimited: (event: RequestEvent) => Promise<boolean> };

function wrap(limiter: RateLimiter): Limiter {
  return {
    isLimited: async (event) =>
      env.E2E_DISABLE_RATE_LIMITER === 'true' ? false : limiter.isLimited(event),
  };
}

export const contactLimiter: Limiter = wrap(rawContactLimiter);
