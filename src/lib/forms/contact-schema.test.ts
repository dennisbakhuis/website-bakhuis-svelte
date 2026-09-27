import { describe, expect, it } from 'vitest';
import { contactSchema } from './contact-schema';

const valid = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to talk about analytical engines.',
  website: '',
  capToken: 'token',
};

describe('contactSchema', () => {
  it('accepts a valid submission', () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects the honeypot and bad e-mails', () => {
    expect(contactSchema.safeParse({ ...valid, website: 'spam' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: 'short' }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, capToken: '' }).success).toBe(false);
  });
});
