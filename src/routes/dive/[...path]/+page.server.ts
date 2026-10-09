import type { PageServerLoad } from './$types';
import { divelog } from '$lib/divelog.server';
import { divePublicLoad } from '$lib/divelog/server/load';

export const load: PageServerLoad = (event) => divePublicLoad(divelog, event.params.path, event);
