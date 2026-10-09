import type { PageServerLoad } from './$types';
import { divelog } from '$lib/divelog.server';
import { adminLoad } from '$lib/divelog/server/load';

export const load: PageServerLoad = (event) => adminLoad(divelog, event.params.path, event);
