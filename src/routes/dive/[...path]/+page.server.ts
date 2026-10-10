import type { PageServerLoad } from './$types';
import { divelog } from '$lib/divelog.server';
import { divePublicLoad } from '@divelog/kit/server';

export const load: PageServerLoad = (event) => divePublicLoad(divelog, event.params.path, event);
