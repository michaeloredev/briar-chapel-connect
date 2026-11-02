'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Plus, X } from 'lucide-react';
import { POLL_LIMITS } from '@/lib/data/group-activity';
import { fromDateTimeLocalValue } from '@/lib/utils/date';
import { groupRequest } from './request';

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

export default function PollFormDialog({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [question, setQuestion] = React.useState('');
  const [options, setOptions] = React.useState(['', '']);
  const [allowMultiple, setAllowMultiple] = React.useState(false);
  const [allowMemberOptions, setAllowMemberOptions] = React.useState(false);
  const [closesAt, setClosesAt] = React.useState('');

  function reset() {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setAllowMemberOptions(false);
    setClosesAt('');
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || filled.length < POLL_LIMITS.minOptions) {
      setError(`Add a question and at least ${POLL_LIMITS.minOptions} options.`);
      return;
    }
    // The input holds Briar Chapel wall time; convert it the way event times are.
    const closes_at = closesAt ? fromDateTimeLocalValue(closesAt) : null;
    if (closesAt && !closes_at) {
      setError('Enter a valid closing date and time.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await groupRequest(
        '/api/group-polls',
        {
          method: 'POST',
          body: JSON.stringify({
            group_id: groupId,
            question: question.trim(),
            options: filled,
            allow_multiple: allowMultiple,
            allow_member_options: allowMemberOptions,
            closes_at,
          }),
        },
        'Failed to create poll',
      );
      reset();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <BarChart3 className="h-4 w-4" aria-hidden />
        New poll
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="poll-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <h2 id="poll-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">New poll</h2>
              <button
                type="button"
                className="rounded-md p-1 text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={() => !loading && setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
              <div>
                <label htmlFor="poll-question" className={LABEL}>Question</label>
                <input
                  id="poll-question"
                  required
                  maxLength={POLL_LIMITS.question}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={FIELD}
                  placeholder="Which night works best for the next meetup?"
                />
              </div>

              <fieldset>
                <legend className={LABEL}>Options</legend>
                <div className="mt-1 space-y-2">
                  {options.map((value, i) => (
                    <div key={i} className="flex gap-2">
                      <label htmlFor={`poll-option-${i}`} className="sr-only">Option {i + 1}</label>
                      <input
                        id={`poll-option-${i}`}
                        maxLength={POLL_LIMITS.option}
                        value={value}
                        onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))}
                        className={FIELD.replace('mt-1 ', '')}
                        placeholder={`Option ${i + 1}`}
                      />
                      {options.length > POLL_LIMITS.minOptions ? (
                        <button
                          type="button"
                          onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label={`Remove option ${i + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                {options.length < POLL_LIMITS.maxOptions ? (
                  <button
                    type="button"
                    onClick={() => setOptions((prev) => [...prev, ''])}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add option
                  </button>
                ) : null}
              </fieldset>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Let people pick more than one
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowMemberOptions}
                    onChange={(e) => setAllowMemberOptions(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Let members add their own options
                </label>
              </div>

              <div>
                <label htmlFor="poll-closes" className={LABEL}>
                  Closes <span className="font-normal text-slate-500 dark:text-slate-400">(optional, Briar Chapel time)</span>
                </label>
                <input
                  id="poll-closes"
                  type="datetime-local"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                  className={FIELD}
                />
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Creating…' : 'Create poll'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
