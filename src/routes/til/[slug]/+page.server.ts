import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { blogUrls } from '$lib/blog-config';

export const load: PageServerLoad = ({ params }) => {
  redirect(301, blogUrls.post(params.slug));
};
