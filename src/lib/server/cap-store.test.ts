import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { consumeNonce, consumeToken, storeToken, _resetForTests } from './cap-store';

beforeEach(() => {
  _resetForTests();
  vi.useFakeTimers();
});

afterEach(() => {
  _resetForTests();
  vi.useRealTimers();
});

describe('cap-store nonces', () => {
  it('accepts a fresh nonce and rejects a replay within the ttl', async () => {
    expect(await consumeNonce('sig-1', 60_000)).toBe(true);
    expect(await consumeNonce('sig-1', 60_000)).toBe(false);
  });

  it('accepts the nonce again after it expires', async () => {
    expect(await consumeNonce('sig-1', 1000)).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(await consumeNonce('sig-1', 1000)).toBe(true);
  });
});

describe('cap-store tokens', () => {
  it('consumes a stored token exactly once', () => {
    storeToken('key-1', Date.now() + 60_000);
    expect(consumeToken('key-1')).toBe(true);
    expect(consumeToken('key-1')).toBe(false);
  });

  it('rejects an unknown token', () => {
    expect(consumeToken('nope')).toBe(false);
  });

  it('ignores tokens stored with an expiry in the past', () => {
    storeToken('key-1', Date.now() - 1);
    expect(consumeToken('key-1')).toBe(false);
  });

  it('prunes expired entries on the timer', () => {
    storeToken('key-1', Date.now() + 1000);
    vi.advanceTimersByTime(90_000);
    expect(consumeToken('key-1')).toBe(false);
  });
});
