'use client';

import * as React from 'react';

type Props = {
  placeholder?: string;
  onSubmit: (content: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
};

export default function CommentComposer({ placeholder = 'Write a comment…', onSubmit, disabled, className = '' }: Props) {
  const [value, setValue] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(value.trim());
      setValue('');
    } catch (err: any) {
      setError(err?.message ?? 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled || submitting}
      />
      {error ? <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <div className="mt-2 flex items-center justify-end">
        <button
          type="submit"
          className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          disabled={disabled || submitting || !value.trim()}
        >
          {submitting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </form>
  );
}


