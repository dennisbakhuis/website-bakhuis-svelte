import { json } from '@sveltejs/kit';

// Liveness probe for the Docker/compose healthcheck. Must stay dynamic —
// the layout prerenders everything else, but a prerendered health file
// would report "ok" even when the node process is wedged.
export const prerender = false;

export const GET = () => {
  return json({ status: 'ok' });
};
