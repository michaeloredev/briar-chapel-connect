'use client';

import * as React from 'react';
import { Plus, X } from 'lucide-react';

type Props = {
  categorySlug: string;
  serviceSlug: string;
  className?: string;
};

export function AddProviderButton({ categorySlug, serviceSlug, className = '' }: Props) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [name, setName] = React.useState('');
  const [summary, setSummary] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categorySlug,
          service: serviceSlug,
          name,
          summary,
          details,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Failed to create provider');
      }
      // Clear form and close
      setName('');
      setSummary('');
      setDetails('');
      setTags('');
      setContactEmail('');
      setContactPhone('');
      setOpen(false);
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
        className={`inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Add provider"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Add Provider</h2>
              <button
                type="button"
                className="p-1 rounded-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => !loading && setOpen(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Business or person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Summary</label>
                <input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short one-line summary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Details</label>
                <textarea
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Longer description of services"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. insured, local, eco-friendly"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}