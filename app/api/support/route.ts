import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Resend } from 'resend';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { SUPPORT_CATEGORIES, type SupportCategory } from '@/lib/data/support-categories';

const SUPPORT_INBOX = 'michael.ore.dev@gmail.com';
// Shares the Resend account behind jdrock.com, so it sends from that verified
// domain. Only the support inbox ever sees this address; replies go to the
// neighbor through replyTo.
const FROM = 'Briar Chapel Connect <support@jdrock.com>';

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 150;
const MAX_MESSAGE = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Payload = {
  name?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
  page?: string;
  /** Honeypot: hidden from people, filled in by bots. */
  website?: string;
};

/** Short, readable ticket reference, e.g. BCC-261101-7K3Q. */
function ticketId(now: Date): string {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 4).toUpperCase();
  return `BCC-${ymd}-${suffix}`;
}

function isSupportCategory(value: string): value is SupportCategory {
  return SUPPORT_CATEGORIES.some((c) => c.value === value);
}

// Public on purpose: someone who can't sign in is exactly who needs support.
export async function POST(req: Request) {
  try {
    const body: Payload = await req.json();

    // A filled honeypot means a bot. Answer as if it worked so it learns nothing.
    if (body.website) {
      return NextResponse.json({ ticket: ticketId(new Date()) }, { status: 201 });
    }

    const name = (body.name || '').trim();
    const email = (body.email || '').trim();
    const category = (body.category || '').trim();
    const subject = (body.subject || '').trim();
    const message = (body.message || '').trim();
    const page = (body.page || '').trim().slice(0, 300);

    if (!name || !email || !subject || !message) {
      return apiBadRequest('Missing required fields');
    }
    if (!EMAIL_PATTERN.test(email) || email.length > MAX_EMAIL) {
      return apiBadRequest('Please enter a valid email address');
    }
    if (!isSupportCategory(category)) {
      return apiBadRequest('Invalid category');
    }
    if (name.length > MAX_NAME || subject.length > MAX_SUBJECT || message.length > MAX_MESSAGE) {
      return apiBadRequest('One of the fields is too long');
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not set');
    }

    const { userId } = await auth();
    const now = new Date();
    const ticket = ticketId(now);
    const categoryLabel = SUPPORT_CATEGORIES.find((c) => c.value === category)!.label;

    const text = [
      `Ticket:    ${ticket}`,
      `Category:  ${categoryLabel}`,
      `From:      ${name} <${email}>`,
      `Account:   ${userId ?? 'signed out'}`,
      `Page:      ${page || 'unknown'}`,
      `Submitted: ${now.toISOString()}`,
      '',
      `Subject: ${subject}`,
      '',
      message,
      '',
      '— Reply to this email to answer the neighbor directly.',
    ].join('\n');

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: SUPPORT_INBOX,
      replyTo: email,
      subject: `[${ticket}] ${categoryLabel}: ${subject}`,
      text,
    });

    if (error) {
      console.error('[Support][POST] send error:', error.message);
      return apiError(new Error(error.message), 'Failed to send your message');
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to send your message');
  }
}
