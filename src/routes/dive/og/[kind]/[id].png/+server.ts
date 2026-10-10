import type { RequestHandler } from './$types';
import { divelog } from '$lib/divelog.server';
import { diveOg } from '@divelog/kit/og';

export const GET: RequestHandler = (event) =>
  diveOg(divelog, event.params.kind, event.params.id, event);
