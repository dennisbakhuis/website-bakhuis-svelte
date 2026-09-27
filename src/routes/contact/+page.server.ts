import type { Actions, PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { contactSchema } from '$lib/forms/contact-schema';
import { contactAction } from '$lib/server/contact-action';

export const load: PageServerLoad = async () => {
  return { form: await superValidate(zod(contactSchema)) };
};

export const actions: Actions = { default: contactAction };
