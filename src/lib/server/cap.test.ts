import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

vi.mock('$env/dynamic/private', () => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/public', () => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$app/environment', () => ({ dev: true, building: false }));

function makeToken(): { token: string; tokenKey: string } {
  const id = 'abcdef0123456789';
  const verToken = 'deadbeefcafebabe';
  const tokenKey = `${id}:${createHash('sha256').update(verToken).digest('hex')}`;
  return { token: `${id}:${verToken}`, tokenKey };
}

describe('verifyCapToken', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it('auto-passes when CAP_ENABLED is false', async () => {
    vi.doMock('$env/dynamic/private', () => ({ env: { CAP_ENABLED: 'false' } }));
    vi.doMock('$env/dynamic/public', () => ({
      env: { PUBLIC_SITE_URL: 'https://dev.dennisbakhuis.nl' },
    }));

    const { verifyCapToken } = await import('./cap');
    expect(await verifyCapToken('any-token')).toBe(true);
  });

  it('auto-passes in dummy mode even when enabled', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_DUMMY_MODE: 'always_pass', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_CAP_API_ENDPOINT: '/api/cap/' } }));

    const { verifyCapToken } = await import('./cap');
    expect(await verifyCapToken('whatever')).toBe(true);
  });

  it('returns false when the token is empty or malformed', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_CAP_API_ENDPOINT: '/api/cap/' } }));

    const { verifyCapToken } = await import('./cap');
    expect(await verifyCapToken('')).toBe(false);
    expect(await verifyCapToken('no-colon-here')).toBe(false);
    expect(await verifyCapToken(':starts-with-colon')).toBe(false);
    expect(await verifyCapToken('ends-with-colon:')).toBe(false);
  });

  it('returns false when the token is unknown to the store', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_CAP_API_ENDPOINT: '/api/cap/' } }));

    const { verifyCapToken } = await import('./cap');
    expect(await verifyCapToken('aaaa:bbbb')).toBe(false);
  });

  it('accepts a stored token once and rejects the replay', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_CAP_API_ENDPOINT: '/api/cap/' } }));

    const { token, tokenKey } = makeToken();
    const { storeToken, _resetForTests } = await import('./cap-store');
    _resetForTests();
    storeToken(tokenKey, Date.now() + 60_000);

    const { verifyCapToken } = await import('./cap');
    expect(await verifyCapToken(token)).toBe(true);
    expect(await verifyCapToken(token)).toBe(false);
  });

  it('exposes the configured secret and enabled state', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({ env: { PUBLIC_CAP_API_ENDPOINT: '/api/cap/' } }));

    const { isCapEnabled, getCapSecret } = await import('./cap');
    expect(isCapEnabled()).toBe(true);
    expect(getCapSecret()).toBe('x'.repeat(32));
  });

  it('boot-time: refuses to start in production when CAP_ENABLED is not "true"', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'false', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({
      env: {
        PUBLIC_CAP_API_ENDPOINT: '/api/cap/',
        PUBLIC_SITE_URL: 'https://dennisbakhuis.nl',
      },
    }));

    await expect(import('./cap')).rejects.toThrow(/CAP_ENABLED must be exactly/);
  });

  it('boot-time: refuses to start in production when CAP_SECRET is too short', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'short' },
    }));
    vi.doMock('$env/dynamic/public', () => ({
      env: {
        PUBLIC_CAP_API_ENDPOINT: '/api/cap/',
        PUBLIC_SITE_URL: 'https://dennisbakhuis.nl',
      },
    }));

    await expect(import('./cap')).rejects.toThrow(/CAP_SECRET must be set/);
  });

  it('boot-time: refuses to start in production without PUBLIC_CAP_API_ENDPOINT', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'true', CAP_SECRET: 'x'.repeat(32) },
    }));
    vi.doMock('$env/dynamic/public', () => ({
      env: { PUBLIC_SITE_URL: 'https://dennisbakhuis.nl' },
    }));

    await expect(import('./cap')).rejects.toThrow(/PUBLIC_CAP_API_ENDPOINT must be set/);
  });

  it('boot-time: fails closed when PUBLIC_SITE_URL is missing or unparseable', async () => {
    for (const publicEnv of [{}, { PUBLIC_SITE_URL: 'not a url' }]) {
      vi.resetModules();
      vi.doMock('$env/dynamic/private', () => ({ env: { CAP_ENABLED: 'false' } }));
      vi.doMock('$env/dynamic/public', () => ({ env: publicEnv }));

      await expect(import('./cap')).rejects.toThrow(/CAP_ENABLED must be exactly/);
    }
  });

  it('boot-time: dummy mode skips all production guards', async () => {
    vi.doMock('$env/dynamic/private', () => ({
      env: { CAP_ENABLED: 'false', CAP_DUMMY_MODE: 'always_pass' },
    }));
    vi.doMock('$env/dynamic/public', () => ({
      env: { PUBLIC_SITE_URL: 'https://dennisbakhuis.nl' },
    }));

    const mod = await import('./cap');
    expect(await mod.verifyCapToken('any')).toBe(true);
  });

  it('boot-time: dev hostname does not trigger the guard', async () => {
    vi.doMock('$env/dynamic/private', () => ({ env: { CAP_ENABLED: 'false' } }));
    vi.doMock('$env/dynamic/public', () => ({
      env: { PUBLIC_SITE_URL: 'https://dev.dennisbakhuis.nl' },
    }));

    const mod = await import('./cap');
    expect(await mod.verifyCapToken('any')).toBe(true);
  });
});
