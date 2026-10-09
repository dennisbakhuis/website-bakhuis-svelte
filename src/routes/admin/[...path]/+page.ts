import type { PageLoad } from './$types';
import { withAdminPage } from '$lib/divelog/routes/admin-pages';

export const load: PageLoad = ({ data }) => withAdminPage(data);
