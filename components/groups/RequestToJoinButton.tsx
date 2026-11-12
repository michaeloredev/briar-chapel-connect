'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Lock, X } from 'lucide-react';
import { MAX_REQUEST_MESSAGE } from '@/lib/data/group-join-requests';
import { groupRequest } from './request';

type Props = {
  groupId: string;
  groupTitle: string;
  /** The note of the signed-in user's pending request, if they have one. */
  pendingMessage?: string | null;
};

/**
 * Join a private group: a short note to the owner, then a pending state the
 * requester can withdraw. Membership is granted by /api/group-join-requests
 * when the owner or a site admin approves.
 */
export default function RequestToJoinButton({ groupId, groupTitle, pendingMessage = null }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError('Tell the group a little about yourself.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await groupRequest(
        '/api/group-join-requests',
        { method: 'POST', body: JSON.stringify({ group_id: groupId, message: message.trim() }) },
        'Could not send your request.',
      );
      setOpen(false);
      setMessage('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request.');
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    setBusy(true);
    setError(null);
    try {
      await groupRequest(
        `/api/group-join-requests?group_id=${encodeURIComponent(groupId)}`,
        { method: 'DELETE' },
        'Could not withdraw your request.',
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not withdraw your request.');
    } finally {
      setBusy(false);
    }
  }

  if (pendingMessage !== null) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            <Clock className="h-4 w-4" aria-hidden />
            Request pending
          </span>
          <button
            type="button"
            onClick={withdraw}
            disabled={busy}
            className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {busy ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </div>
        {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    );
  }

  const remaining = MAX_REQUEST_MESSAGE - message.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Request to join
      </button>

      {open ? (
        <div role="dialog" aria-modal="true" aria-labelledby="join-request-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <h2 id="join-request-title" className="text-lg font-semibold text-slate-900 dark:text-white">
                Ask to join {groupTitle}
              </h2>
              <button
                type="button"
                onClick={() => !busy && setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4 px-5 py-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This is a private group. The group&apos;s owner will read your note and decide.
              </p>
              <div>
                <label htmlFor="join-request-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tell them about yourself <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <textarea
                  id="join-request-message"
                  ref={textareaRef}
                  required
                  rows={5}
                  maxLength={MAX_REQUEST_MESSAGE}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Who you are, where in Briar Chapel you live, and why you'd like to join."
                  aria-describedby="join-request-count"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p id="join-request-count" className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">
                  {remaining} characters left
                </p>
              </div>
              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || !message.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                >
                  {busy ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
