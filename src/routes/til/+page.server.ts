import type { PageServerLoad } from './$types';
import { legacyKindRedirect } from '@blog/kit/server';
import { blog } from '$lib/blog';

/** TIL notes live in the blog now, as a filter. */
export const load: PageServerLoad = ({ url }) => legacyKindRedirect(blog, 'til', url);
