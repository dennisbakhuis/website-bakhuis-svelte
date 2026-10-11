import { feedResponse } from '@blog/kit/server';
import { blog } from '$lib/blog';

export const prerender = false;

export const GET = (): Promise<Response> => feedResponse(blog, { limit: 30 });
