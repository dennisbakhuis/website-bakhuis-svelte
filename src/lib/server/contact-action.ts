import { fail, type Action } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { contactSchema, type FormFailureCode } from '$lib/forms/contact-schema';
import { verifyCapToken } from '$lib/server/cap';
import { sendContactEmail } from '$lib/server/email';
import { contactLimiter } from '$lib/server/rate-limiter';
import { trackEvent } from '$lib/server/umami';

export const contactAction: Action = async (event) => {
  const form = await superValidate(event.request, zod(contactSchema));

  const userAgent = event.request.headers.get('user-agent') ?? '';
  const ip = event.getClientAddress();

  const track = (name: string) =>
    void trackEvent({
      name,
      url: event.url.pathname,
      hostname: event.url.hostname,
      userAgent,
      ip,
      data: { form_type: 'contact' },
    });

  if (await contactLimiter.isLimited(event)) {
    console.warn(`contact form rate limited for ${ip}`);
    track('form_rate_limited');
    return fail(429, { form, code: 'rate_limited' satisfies FormFailureCode });
  }

  if (!form.valid) {
    track('form_validation_failed');
    return fail(400, { form });
  }

  if (!(await verifyCapToken(form.data.capToken))) {
    track('form_cap_failed');
    return fail(400, { form, code: 'cap_failed' satisfies FormFailureCode });
  }

  try {
    await sendContactEmail(form.data);
  } catch (err) {
    console.error('contact email send failed', err);
    track('form_submit_failed');
    return fail(502, { form, code: 'submission_failed' satisfies FormFailureCode });
  }

  track('contact_form_submitted');

  return { form, success: true };
};
