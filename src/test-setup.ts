import { vi } from 'vitest';

// The site's own addresses come from the environment, never from code; the
// unit suite runs with an example value. A test file's own mock overrides it.
vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_CONTACT_EMAIL: 'owner@example.org' } as Record<string, string | undefined>,
}));
