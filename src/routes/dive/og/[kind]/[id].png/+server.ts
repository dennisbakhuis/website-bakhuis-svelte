import type { RequestHandler } from './$types';
import { divelog } from '$lib/divelog.server';
import { diveOg } from '$lib/divelog/og';

export const GET: RequestHandler = (event) =>
  diveOg(divelog, event.params.kind, event.params.id, event);
