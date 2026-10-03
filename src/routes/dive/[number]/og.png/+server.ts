import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api, ApiError } from '$lib/server/api';
import { diveCardSvg } from '$lib/server/og/card';
import { OG_CACHE, renderPng } from '$lib/server/og/render';
import type { Dive } from '$lib/dive/types';

// Deliberately unauthenticated: the public endpoint 404s private and draft
// dives, so a shared link never leaks one.
export const GET: RequestHandler = async ({ params, fetch }) => {
  if (!/^\d+$/.test(params.number)) error(404, 'Not found');
  let dive: Dive;
  try {
    dive = await api<Dive>(fetch, `/api/v1/dive/dives/${params.number}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) error(404, 'Not found');
    error(502, 'Backend unreachable');
  }
  const png = await renderPng(diveCardSvg(dive));
  return new Response(png as BodyInit, {
    headers: { 'content-type': 'image/png', 'cache-control': OG_CACHE },
  });
};
