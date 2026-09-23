'use client';

import * as React from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EVENT_CATEGORIES, getCategoryMeta } from '@/lib/data/event-categories';
import { toDateTimeLocalValue } from '@/lib/utils/date';

/**
 * Moving the start of an event should carry its end along, the way a calendar
 * app does. Without this, changing only the date leaves the end behind and the
 * pair inverts -- which reads to the user as the form rejecting a valid edit.
 */
function shiftEndWithStart(prevStart: string, nextStart: string, end: string): string {
  if (!end || !prevStart || !nextStart) return end;
  const prev = new Date(prevStart);
  const next = new Date(nextStart);
  const endDate = new Date(end);
  if ([prev, next, endDate].some((d) => Number.isNaN(d.getTime()))) return end;

  const shifted = new Date(endDate.getTime() + (next.getTime() - prev.getTime()));
  return toDateTimeLocalValue(shifted.toISOString());
}

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

/** The subset of an event this form can edit. */
export type EditableEvent = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  event_date: string;
  end_date?: string | null;
  location?: string | null;
  address?: string | null;
};

type Props = {
  className?: string;
  buttonLabel?: string;
  dialogTitle?: string;
  defaultLocation?: string;
  /** Lock the category (hides the dropdown). Used for group-scoped events. */
  fixedCategory?: string;
  /** Passed through to the API when creating group events. */
  groupId?: string;
  /**
   * Present puts the dialog in edit mode: the form opens populated and submits
   * a PATCH for this row instead of creating a new event.
   */
  event?: EditableEvent;
};

export default function EventFormDialog({
  className = '',
  buttonLabel,
  dialogTitle,
  defaultLocation = 'Briar Chapel',
  fixedCategory,
  groupId,
  event,
}: Props) {
  const isEdit = Boolean(event);
  const label = buttonLabel ?? (isEdit ? 'Edit' : 'Add Event');
  const heading = dialogTitle ?? (isEdit ? 'Edit Event' : 'Create Event');
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState(event?.title ?? '');
  const [description, setDescription] = React.useState(event?.description ?? '');
  const [category, setCategory] = React.useState(event?.category ?? fixedCategory ?? 'other');
  const [start, setStart] = React.useState(toDateTimeLocalValue(event?.event_date));
  const [end, setEnd] = React.useState(toDateTimeLocalValue(event?.end_date));
  const [location, setLocation] = React.useState(event?.location ?? defaultLocation);
  const [address, setAddress] = React.useState(event?.address ?? '');

  React.useEffect(() => {
    if (isEdit) return;
    setLocation(defaultLocation);
  }, [defaultLocation, isEdit]);

  function resetForm() {
    // In edit mode "reset" means back to the stored row, not empty, so
    // cancelling and reopening does not show a half-cleared form.
    setTitle(event?.title ?? '');
    setDescription(event?.description ?? '');
    setCategory(event?.category ?? fixedCategory ?? 'other');
    setStart(toDateTimeLocalValue(event?.event_date));
    setEnd(toDateTimeLocalValue(event?.end_date));
    setLocation(event?.location ?? defaultLocation);
    setAddress(event?.address ?? '');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!title.trim()) { setError('Title is required.'); return; }
      if (!start) { setError('Start date/time is required.'); return; }
      if (end && new Date(end) < new Date(start)) {
        setError('End date and time must be after the start.');
        return;
      }

      const startISO = new Date(start).toISOString();
      const endISO = end ? new Date(end).toISOString() : undefined;

      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || undefined,
        category: fixedCategory ?? category ?? 'general',
        event_date: startISO,
        // PATCH treats undefined as "leave alone", so an edit that clears the
        // end date has to send null explicitly.
        end_date: isEdit ? (endISO ?? null) : endISO,
        location: location.trim() || 'Briar Chapel',
      };
      if (!fixedCategory) {
        payload.address = isEdit ? (address.trim() || null) : (address.trim() || undefined);
      }
      if (groupId) payload.group_id = groupId;
      if (isEdit) payload.id = event!.id;

      const res = await fetch('/api/events', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(await readFailedResponse(res, isEdit ? 'Failed to update event' : 'Failed to create event'));
      }
      if (!isEdit) resetForm();
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const showCategoryPicker = !fixedCategory;
  const showAddress = !fixedCategory;

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
        title={isEdit ? `Edit ${event!.title}` : label}
      >
        {isEdit ? <Pencil className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        {label}
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
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{heading}</h2>
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
                  placeholder="Event title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What is happening?"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Start <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={start}
                    onChange={(e) => {
                      const nextStart = e.target.value;
                      setEnd((currentEnd) => shiftEndWithStart(start, nextStart, currentEnd));
                      setStart(nextStart);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">End</label>
                  <input
                    type="datetime-local"
                    value={end}
                    min={start || undefined}
                    onChange={(e) => setEnd(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

                {showCategoryPicker && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                    <div className="mt-1">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {EVENT_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="mt-2 inline-flex items-center gap-2 text-xs">
                        <span
                          className={[
                            'px-2 py-0.5 rounded-full',
                            getCategoryMeta(category).badgeClasses,
                          ].join(' ')}
                        >
                          {getCategoryMeta(category).label}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">Preview</span>
                      </div>
                    </div>
                  </div>
                )}

                {showAddress && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Street address"
                    />
                  </div>
                )}
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
                  disabled={loading || !title.trim() || !start}
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
