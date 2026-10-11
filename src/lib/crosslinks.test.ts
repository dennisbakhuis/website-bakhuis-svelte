import { describe, expect, it } from 'vitest';
import { DEFAULT_CONFIG, createUrls } from '@divelog/kit/core';
import { urls } from './divelog-config';

/*
 * svelte.config.js resolves `[[dive:…]]` and `[[site:…]]` in posts with
 * `createUrls(DEFAULT_CONFIG)` from the divelog kit, because it cannot import
 * divelog-config.ts. This fails when the two stop agreeing.
 */
describe('blog cross-links', () => {
  it('point where the dive log is mounted', () => {
    const crosslinkUrls = createUrls(DEFAULT_CONFIG);
    expect(crosslinkUrls.dive('1')).toBe(urls.dive('1'));
    expect(crosslinkUrls.site('x')).toBe(urls.site('x'));
  });
});
