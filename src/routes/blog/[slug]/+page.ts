import type { PageLoad } from './$types';
import { loadBlogPost } from '@blog/kit/core';
import { blog } from '$lib/blog';

export const load: PageLoad = ({ params }) => loadBlogPost(blog, params.slug);
