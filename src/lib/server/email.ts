import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '$env/dynamic/private';
import type { ContactFormData } from '$lib/forms/contact-schema';

const DEFAULT_TO_EMAIL = 'owner@example.org';
const DEFAULT_FROM_EMAIL = 'website@example.org';

export function sanitizeHeader(value: string): string {
  return value
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, 200);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SINGLE_MAILBOX_REGEX = /^[^\s,;<>"'()[\]\\]+@[^\s,;<>"'()[\]\\]+\.[^\s,;<>"'()[\]\\]+$/;

export function singleAddressOrThrow(raw: string): string {
  if (!SINGLE_MAILBOX_REGEX.test(raw)) {
    throw new Error('reply-to must be a single address');
  }
  return raw;
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;
  const secure = (env.SMTP_SECURE ?? 'false') === 'true';
  const hasAuth = !!env.SMTP_USERNAME;
  cachedTransport = nodemailer.createTransport({
    host: env.SMTP_HOST ?? 'localhost',
    port: parseInt(env.SMTP_PORT ?? '1325', 10),
    secure,
    requireTLS: secure,
    auth: hasAuth ? { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD } : undefined,
    pool: true,
    maxConnections: 3,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return cachedTransport;
}

export function formatTimestamp(dt: Date): string {
  return dt.toLocaleString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Amsterdam',
  });
}

export async function sendContactEmail(data: ContactFormData): Promise<void> {
  const transport = getTransport();
  const fromEmail = env.SMTP_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
  const toEmail = env.SMTP_TO_EMAIL ?? DEFAULT_TO_EMAIL;
  const safeReplyTo = singleAddressOrThrow(sanitizeHeader(data.email));
  const safeName = sanitizeHeader(data.name);
  const timestamp = formatTimestamp(new Date());

  const textBody = `New message via the contact form

Received: ${timestamp}

Name: ${safeName}
E-mail: ${safeReplyTo}

Message:
${data.message}`;

  const htmlBody = `<html><body>
  <h2>New message via the contact form</h2>
  <p><em>Received: ${escapeHtml(timestamp)}</em></p>
  <p><strong>Name:</strong> ${escapeHtml(safeName)}</p>
  <p><strong>E-mail:</strong> ${escapeHtml(safeReplyTo)}</p>
  <h3>Message</h3>
  <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
</body></html>`;

  await transport.sendMail({
    from: fromEmail,
    to: toEmail,
    replyTo: safeReplyTo,
    subject: `dennisbakhuis.nl: message from ${safeName}`,
    text: textBody,
    html: htmlBody,
  });
}

export function resetTransportForTests(): void {
  cachedTransport = null;
}
