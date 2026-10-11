import type { PageServerLoad } from './$types';
import { loadBlogList } from '@blog/kit/server';
import { blog } from '$lib/blog';

export const load: PageServerLoad = ({ url }) => loadBlogList(blog, url);
