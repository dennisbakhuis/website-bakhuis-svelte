import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { api, ApiError } from '$lib/server/api';
import { siteCardSvg } from '$lib/server/og/card';
import { OG_CACHE, renderPng } from '$lib/server/og/render';
import type { DiveListItem, Site } from '$lib/dive/types';
import { urls } from '$lib/divelog-config';

export const GET: RequestHandler = async ({ params, fetch }) => {
  if (!/^[a-z0-9-]+$/.test(params.slug)) error(404, 'Not found');
  let data: { site: Site; dives: DiveListItem[] };
  try {
    data = await api<{ site: Site; dives: DiveListItem[] }>(
      fetch,
      urls.api(`/dive/sites/${params.slug}`),
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) error(404, 'Not found');
    error(502, 'Backend unreachable');
  }
  const png = await renderPng(siteCardSvg(data.site, data.dives));
  return new Response(png as BodyInit, {
    headers: { 'content-type': 'image/png', 'cache-control': OG_CACHE },
  });
};
