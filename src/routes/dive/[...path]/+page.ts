import type { PageLoad } from './$types';
import { withPublicPage } from '$lib/divelog/routes/public-pages';

export const load: PageLoad = ({ data }) => withPublicPage(data);
