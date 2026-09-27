import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';

export const load: PageServerLoad = async (event) => {
  const next = await apiOrError<{ number: number }>(event, '/api/v1/admin/dives/next-number');
  return { nextNumber: next.number };
};
