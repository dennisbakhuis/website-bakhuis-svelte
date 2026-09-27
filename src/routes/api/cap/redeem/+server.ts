import { json, error } from '@sveltejs/kit';
import { validateChallenge } from 'capjs-core';
import type { RequestHandler } from './$types';
import { isCapEnabled, getCapSecret } from '$lib/server/cap';
import { consumeNonce, storeToken } from '$lib/server/cap-store';

export const prerender = false;

export const POST: RequestHandler = async ({ request }) => {
  if (!isCapEnabled()) {
    error(404, 'Cap is not enabled on this server');
  }

  let body: { token?: unknown; solutions?: unknown };
  try {
    body = await request.json();
  } catch {
    error(400, 'invalid JSON body');
  }

  if (typeof body.token !== 'string' || !Array.isArray(body.solutions)) {
    error(400, 'token and solutions are required');
  }

  const result = await validateChallenge(
    getCapSecret(),
    { token: body.token, solutions: body.solutions as number[] },
    { consumeNonce },
  );

  if (result.success) {
    storeToken(result.tokenKey!, result.expires);
    return json({ success: true, token: result.token, expires: result.expires });
  }

  console.info('cap redeem rejected:', result.reason);
  return json({ success: false, reason: result.reason }, { status: 400 });
};
