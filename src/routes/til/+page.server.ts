import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

/** TIL notes live in the blog now, as a filter. */
export const load: PageServerLoad = ({ url }) => {
  const tag = url.searchParams.get('tag');
  redirect(301, `/blog?kind=til${tag ? `&tag=${encodeURIComponent(tag)}` : ''}`);
};
