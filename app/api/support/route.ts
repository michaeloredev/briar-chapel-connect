import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiError, apiBadRequest } from '@/lib/api/response';
import { SUPPORT_CATEGORIES, type SupportCategory } from '@/lib/data/support-categories';

import { sendAdminEmail } from '@/lib/email/admin';

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

    // Replies go straight to the neighbor through replyTo.
    try {
      await sendAdminEmail({ subject: `[${ticket}] ${categoryLabel}: ${subject}`, text, replyTo: email });
    } catch (sendError) {
      console.error('[Support][POST] send error:', sendError instanceof Error ? sendError.message : sendError);
      return apiError(sendError, 'Failed to send your message');
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err) {
    return apiError(err, 'Failed to send your message');
  }
}
