import { Resend } from 'resend';

/** Where support tickets and group proposals go. */
export const ADMIN_INBOX = 'michael.ore.dev@gmail.com';

// briarchapelconnect.com is verified in Resend (DNS on Cloudflare). Nothing
// receives mail at this address -- support replies go to the neighbor through
// replyTo -- so it never needs a mailbox.
export const FROM_ADDRESS = 'Briar Chapel Connect <notifications@briarchapelconnect.com>';

/**
 * Email the admin inbox. Throws when RESEND_API_KEY is missing or Resend
 * refuses, so a caller that must not fail on email has to catch.
 */
export async function sendAdminEmail(message: { subject: string; text: string; replyTo?: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');
  const { error } = await new Resend(apiKey).emails.send({
    from: FROM_ADDRESS,
    to: ADMIN_INBOX,
    subject: message.subject,
    text: message.text,
    ...(message.replyTo ? { replyTo: message.replyTo } : {}),
  });
  if (error) throw new Error(error.message);
}
