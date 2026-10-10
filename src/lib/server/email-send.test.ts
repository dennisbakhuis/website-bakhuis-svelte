import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail }));

vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('$env/dynamic/private', () => ({ env: { SMTP_HOST: 'mail.test', SMTP_PORT: '2525' } }));

const { formatTimestamp, resetTransportForTests, sendContactEmail } = await import('./email');

describe('sendContactEmail', () => {
  beforeEach(() => {
    sendMail.mockReset();
    createTransport.mockClear();
    resetTransportForTests();
  });

  it('sends one escaped message with the sender as reply-to', async () => {
    await sendContactEmail({
      name: 'Ann\nOther',
      email: 'ann@example.org',
      message: 'Hi <there>\nsecond line',
      capToken: 'x',
    } as never);
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'mail.test', port: 2525, secure: false, auth: undefined }),
    );
    const mail = sendMail.mock.calls[0][0];
    expect(mail.replyTo).toBe('ann@example.org');
    expect(mail.subject).toBe('dennisbakhuis.nl: message from Ann Other');
    expect(mail.to).toBe('owner@example.org');
    expect(mail.html).toContain('Hi &lt;there&gt;<br>second line');
    expect(mail.text).toContain('Hi <there>\nsecond line');
  });

  it('reuses the transport', async () => {
    const data = { name: 'A', email: 'a@b.co', message: 'm', capToken: 'x' } as never;
    await sendContactEmail(data);
    await sendContactEmail(data);
    expect(createTransport).toHaveBeenCalledTimes(1);
  });

  it('refuses a reply-to with more than one address', async () => {
    const data = { name: 'A', email: 'a@b.co, c@d.co', message: 'm', capToken: 'x' } as never;
    await expect(sendContactEmail(data)).rejects.toThrow('single address');
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('formats timestamps in Amsterdam time', () => {
    expect(formatTimestamp(new Date('2026-01-01T12:00:00Z'))).toContain('13:00');
  });
});
