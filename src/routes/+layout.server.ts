import type { LayoutServerLoad } from './$types';

// Server-rendered end to end (no prerender) so hooks.server.ts sees every
// request: security headers, server-side analytics, admin session checks.
export const prerender = false;

export const load: LayoutServerLoad = ({ locals, url }) => ({
  owner: locals.owner,
  pathname: url.pathname,
});
