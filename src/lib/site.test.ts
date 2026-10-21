import { describe, expect, it } from 'vitest';
import { personLD } from './seo';

describe('the person record', () => {
  it('carries no e-mail address: contact goes through the form', () => {
    expect(personLD()).not.toHaveProperty('email');
  });
});
