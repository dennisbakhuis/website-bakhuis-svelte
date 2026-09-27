import { json, error } from '@sveltejs/kit';
import { generateChallenge } from 'capjs-core';
import type { RequestHandler } from './$types';
import { isCapEnabled, getCapSecret } from '$lib/server/cap';

export const prerender = false;

export const POST: RequestHandler = async () => {
  if (!isCapEnabled()) {
    error(404, 'Cap is not enabled on this server');
  }

  try {
    const challenge = await generateChallenge(getCapSecret());
    return json(challenge);
  } catch (err) {
    console.error('cap challenge generation failed', err);
    error(500, 'failed to generate challenge');
  }
};
