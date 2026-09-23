'use client';

import * as React from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GROUP_TYPES } from '@/lib/data/group-types';

/** The subset of a group this form can edit. */
export type EditableGroup = {
  id: string;
  title: string;
  description: string;
  type: string;
  location?: string | null;
};

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

type Props = {
  className?: string;
  /**
   * Present puts the dialog in edit mode: the form opens populated and submits
   * a PATCH for this row instead of creating a new group.
   */
  group?: EditableGroup;
};

export default function GroupFormDialog({ className = '', group }: Props) {
  const router = useRouter();
  const isEdit = Boolean(group);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(group?.title ?? '');
  const [description, setDescription] = React.useState(group?.description ?? '');
  const [type, setType] = React.useState(group?.type ?? GROUP_TYPES[0].value);
  const [location, setLocation] = React.useState(group?.location ?? '');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!title.trim() || !description.trim()) {
        setError('Title and description are required.');
        setLoading(false);
        return;
      }
      const res = await fetch('/api/groups', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEdit ? { id: group!.id } : {}),
          title: title.trim(),
          description: description.trim(),
          type,
          location: location.trim() || null,
        }),
      });
      if (!res.ok) {
        throw new Error(await readFailedResponse(res, isEdit ? 'Failed to update group' : 'Failed to create group'));
      }
      if (!isEdit) {
        setTitle('');
        setDescription('');
        setType(GROUP_TYPES[0].value);
        setLocation('');
      }
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
        className={
          isEdit
            ? `inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
            : `inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`
        }
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={isEdit ? `Edit ${group!.title}` : 'Create group'}
      >
        {isEdit ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {isEdit ? 'Edit' : 'Create Group'}
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{isEdit ? 'Edit Group' : 'Create Group'}</h2>
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is this group about?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {GROUP_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Neighborhood or venue"
                  />
                </div>
              </div>

              {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

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
                  disabled={loading || !title.trim() || !description.trim()}
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


