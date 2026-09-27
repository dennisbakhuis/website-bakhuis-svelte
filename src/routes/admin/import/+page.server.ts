import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';

type ImportRow = {
  id: string;
  format: string;
  original_name: string;
  created_at: string;
  created: number[];
  updated: number[];
  url: string;
};

export const load: PageServerLoad = async (event) => ({
  imports: await apiOrError<ImportRow[]>(event, '/api/v1/admin/imports'),
});
