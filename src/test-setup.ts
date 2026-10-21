import { vi } from 'vitest';

// The site's own settings come from the environment, never from code; the
// unit suite runs with none set. A test file's own mock overrides it.
vi.mock('$env/dynamic/public', () => ({
  env: {} as Record<string, string | undefined>,
}));
