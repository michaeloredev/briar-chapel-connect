'use client';

import * as React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Body copy -- say what goes away with it, not just "are you sure". */
  description?: React.ReactNode;
  confirmLabel?: string;
  /** Label shown on the confirm button while `onConfirm` is running. */
  pendingLabel?: string;
  /**
   * Runs the action. Throw to keep the dialog open with the error message
   * shown; resolve and the dialog closes itself through `onClose`.
   */
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

/**
 * Confirmation for destructive actions, replacing `window.confirm()`.
 *
 * Built on the native `<dialog>` in modal mode, so the browser provides the
 * focus trap, Esc-to-cancel, inert background and top-layer stacking -- it
 * renders correctly even from inside a card with overflow or transforms.
 * Focus starts on Cancel, so a stray Enter never deletes anything.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  pendingLabel = 'Deleting…',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const titleId = React.useId();
  const descriptionId = React.useId();

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setError(null);
      dialog.showModal();
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const requestClose = () => {
    if (!pending) onClose();
  };

  const confirm = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  };

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Esc fires `cancel`; route it through onClose so `open` stays the
      // single source of truth, and ignore it mid-request.
      onCancel={(e) => {
        e.preventDefault();
        requestClose();
      }}
      // React bubbles through the component tree, not the DOM, so clicks
      // here would otherwise reach whatever clickable card rendered this.
      // A click landing on the <dialog> itself is the backdrop.
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) requestClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-0 text-left shadow-2xl transition duration-150 ease-out starting:scale-95 starting:opacity-0 backdrop:bg-slate-950/50 backdrop:backdrop-blur-[2px] dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden />
          </div>
          <div className="min-w-0 pt-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {description}
              </div>
            ) : null}
            {error ? (
              <p
                role="alert"
                className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"
              >
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end dark:border-slate-700 dark:bg-slate-800/60">
        <button
          ref={cancelRef}
          type="button"
          onClick={requestClose}
          disabled={pending}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 dark:focus:ring-offset-slate-900"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
