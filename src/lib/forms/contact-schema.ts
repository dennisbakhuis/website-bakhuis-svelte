import { z } from 'zod';

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, 'Please enter your name (at least 2 characters).')
    .max(100, 'Your name can be at most 100 characters.'),
  email: z.email('Please enter a valid e-mail address.'),
  message: z
    .string()
    .min(10, 'Tell me a bit more (at least 10 characters).')
    .max(4000, 'Your message can be at most 4000 characters.'),
  // Honeypot: invisible to humans, bots that fill it are rejected.
  website: z.literal(''),
  capToken: z.string().min(1, 'Please confirm you are human first.'),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export type FormFailureCode = 'rate_limited' | 'cap_failed' | 'submission_failed';
