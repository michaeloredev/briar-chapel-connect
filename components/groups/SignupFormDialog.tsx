'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Plus, X } from 'lucide-react';
import { SIGNUP_LIMITS } from '@/lib/data/group-activity';
import { groupRequest } from './request';

const FIELD =
  'mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-sm font-medium text-slate-700 dark:text-slate-300';

/** `limited: false` is an unlimited slot, the default. */
type SlotDraft = { label: string; limited: boolean; capacity: string };
const EMPTY_SLOT: SlotDraft = { label: '', limited: false, capacity: '1' };

export default function SignupFormDialog({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [slots, setSlots] = React.useState<SlotDraft[]>([{ ...EMPTY_SLOT }]);

  function updateSlot(i: number, patch: Partial<SlotDraft>) {
    setSlots((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = slots
      .map((s) => ({ label: s.label.trim(), capacity: s.limited ? Number(s.capacity) : null }))
      .filter((s) => s.label);
    if (!title.trim() || filled.length < SIGNUP_LIMITS.minSlots) {
      setError('Add a title and at least one slot.');
      return;
    }
    if (filled.some((s) => s.capacity !== null && (!Number.isInteger(s.capacity) || s.capacity < 1 || s.capacity > SIGNUP_LIMITS.maxCapacity))) {
      setError(`A limit must be between 1 and ${SIGNUP_LIMITS.maxCapacity} spots.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await groupRequest(
        '/api/group-signups',
        {
          method: 'POST',
          body: JSON.stringify({
            group_id: groupId,
            title: title.trim(),
            description: description.trim() || null,
            slots: filled,
          }),
        },
        'Failed to create sign-up',
      );
      setTitle('');
      setDescription('');
      setSlots([{ ...EMPTY_SLOT }]);
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
        <ClipboardList className="h-4 w-4" aria-hidden />
        New sign-up
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="signup-form-title" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !loading && setOpen(false)} />
          <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <h2 id="signup-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">New sign-up</h2>
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
                <label htmlFor="signup-title" className={LABEL}>Title</label>
                <input
                  id="signup-title"
                  required
                  maxLength={SIGNUP_LIMITS.title}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={FIELD}
                  placeholder="Fall potluck"
                />
              </div>

              <div>
                <label htmlFor="signup-description" className={LABEL}>
                  Details <span className="font-normal text-slate-500 dark:text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="signup-description"
                  rows={3}
                  maxLength={SIGNUP_LIMITS.description}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={FIELD}
                  placeholder="When, where, anything people should know"
                />
              </div>

              <fieldset>
                <legend className={LABEL}>Slots</legend>
                <div className="mt-1 space-y-2">
                  {slots.map((slot, i) => (
                    <div key={i} className="flex gap-2">
                      <label htmlFor={`slot-label-${i}`} className="sr-only">Slot {i + 1} name</label>
                      <input
                        id={`slot-label-${i}`}
                        maxLength={SIGNUP_LIMITS.slotLabel}
                        value={slot.label}
                        onChange={(e) => updateSlot(i, { label: e.target.value })}
                        className={FIELD.replace('mt-1 ', '') + ' min-w-0 flex-1'}
                        placeholder={i === 0 ? 'Dessert' : `Slot ${i + 1}`}
                      />
                      <label htmlFor={`slot-limit-${i}`} className="sr-only">Slot {i + 1} limit</label>
                      <select
                        id={`slot-limit-${i}`}
                        value={slot.limited ? 'limit' : 'none'}
                        onChange={(e) => updateSlot(i, { limited: e.target.value === 'limit' })}
                        className={FIELD.replace('mt-1 w-full', 'w-28 shrink-0')}
                      >
                        <option value="none">No limit</option>
                        <option value="limit">Limit</option>
                      </select>
                      {slot.limited ? (
                        <>
                          <label htmlFor={`slot-capacity-${i}`} className="sr-only">Slot {i + 1} spots</label>
                          <input
                            id={`slot-capacity-${i}`}
                            type="number"
                            min={1}
                            max={SIGNUP_LIMITS.maxCapacity}
                            value={slot.capacity}
                            onChange={(e) => updateSlot(i, { capacity: e.target.value })}
                            className={FIELD.replace('mt-1 w-full', 'w-20 shrink-0')}
                            title="Spots"
                          />
                        </>
                      ) : null}
                      {slots.length > SIGNUP_LIMITS.minSlots ? (
                        <button
                          type="button"
                          onClick={() => setSlots((prev) => prev.filter((_, j) => j !== i))}
                          className="rounded-lg px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label={`Remove slot ${i + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Name each slot. Slots take any number of people unless you set a limit.</p>
                {slots.length < SIGNUP_LIMITS.maxSlots ? (
                  <button
                    type="button"
                    onClick={() => setSlots((prev) => [...prev, { ...EMPTY_SLOT }])}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    Add slot
                  </button>
                ) : null}
              </fieldset>

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
                  {loading ? 'Creating…' : 'Create sign-up'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
