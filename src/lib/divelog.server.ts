/** This site's dive log bound to its backend; server only. */
import { env } from '$env/dynamic/private';
import { createDivelog } from '$lib/divelog/server/divelog';
import { divelogConfig } from '$lib/divelog-config';

export const divelog = createDivelog({
  backendUrl: () => env.BACKEND_URL ?? 'http://localhost:8300',
  config: divelogConfig,
});
