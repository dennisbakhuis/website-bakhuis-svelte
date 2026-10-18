import { afterEach, describe, expect, it, vi } from 'vitest';

describe('contact address', () => {
  afterEach(() => {
    vi.doUnmock('$env/dynamic/public');
    vi.resetModules();
  });

  it('comes from PUBLIC_CONTACT_EMAIL', async () => {
    const { contactEmail, emailHref } = await import('./site');
    expect(contactEmail()).toBe('owner@example.org');
    expect(emailHref()).toBe('mailto:owner@example.org');
  });

  it('is empty when the variable is unset, and the person carries no e-mail', async () => {
    vi.resetModules();
    vi.doMock('$env/dynamic/public', () => ({ env: {} }));
    const { contactEmail } = await import('./site');
    const { personLD } = await import('./seo');
    expect(contactEmail()).toBe('');
    expect(personLD()).not.toHaveProperty('email');
  });
});
