import type { PageServerLoad } from './$types';
import { apiOrError } from '$lib/server/api';
import { urls } from '$lib/divelog-config';

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
  imports: await apiOrError<ImportRow[]>(event, urls.api('/admin/imports')),
});
