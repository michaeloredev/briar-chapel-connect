'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, Send } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { SUPPORT_CATEGORIES } from '@/lib/data/support-categories';

/** Routes answer with `{ error }` JSON; surface that rather than the raw body. */
async function readFailedResponse(res: Response, fallback: string): Promise<string> {
  try {
    const text = await res.text();
    if (!text) return fallback;
    try {
      const parsed = JSON.parse(text) as { error?: string };
      return parsed?.error || fallback;
    } catch {
      return text;
    }
  } catch {
    return fallback;
  }
}

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

export default function SupportForm() {
  const { user } = useUser();
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [category, setCategory] = React.useState<string>(SUPPORT_CATEGORIES[0].value);
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [website, setWebsite] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ticket, setTicket] = React.useState<string | null>(null);

  // Prefill from the signed-in account once Clerk has loaded it, without
  // overwriting anything the visitor already typed.
  React.useEffect(() => {
    if (!user) return;
    setName((v) => v || user.fullName || '');
    setEmail((v) => v || user.primaryEmailAddress?.emailAddress || '');
  }, [user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
          page: document.referrer,
          website,
        }),
      });
      if (!res.ok) {
        throw new Error(await readFailedResponse(res, 'Failed to send your message'));
      }
      const data = (await res.json()) as { ticket: string };
      setTicket(data.ticket);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (ticket) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">Thanks — we got your message</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Your ticket number is <span className="font-mono font-semibold text-slate-900 dark:text-white">{ticket}</span>.
          We&apos;ll reply to {email || 'your email'}.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setTicket(null)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Send another
          </button>
          <Link
            href="/"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="support-name" className={LABEL}>Name</label>
          <input id="support-name" required maxLength={100} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="support-email" className={LABEL}>Email</label>
          <input id="support-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={FIELD} />
        </div>
      </div>

      <div>
        <label htmlFor="support-category" className={LABEL}>What is this about?</label>
        <select id="support-category" value={category} onChange={(e) => setCategory(e.target.value)} className={FIELD}>
          {SUPPORT_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="support-subject" className={LABEL}>Subject</label>
        <input id="support-subject" required maxLength={150} value={subject} onChange={(e) => setSubject(e.target.value)} className={FIELD} placeholder="A short summary" />
      </div>

      <div>
        <label htmlFor="support-message" className={LABEL}>Message</label>
        <textarea
          id="support-message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={FIELD}
          placeholder="What happened, and what did you expect? Include the page or listing if it's relevant."
        />
      </div>

      {/* Honeypot: invisible to people, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="support-website">Website</label>
        <input id="support-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden />
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  );
}
