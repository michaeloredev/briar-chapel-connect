'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type PhotoGalleryProps = {
  images: string[];
  /** Layout of the thumbnail row or grid. */
  className?: string;
  /** Size and shape of each thumbnail. */
  thumbClassName?: string;
  /** Thumbnail pixel size hint, for the img width/height attributes. */
  thumbSize?: number;
  /** "Photo 2 of 4" in labels; name what the photos belong to. */
  label?: string;
};

/**
 * Thumbnails that open a full-size viewer over the page, instead of sending
 * the photo to a new tab with no way back.
 *
 * Built on the native `<dialog>` in modal mode, like ConfirmDialog: the
 * browser provides Esc-to-close, the focus trap, an inert background and
 * top-layer stacking. A click outside the photo closes it; with several
 * photos, the arrow buttons and Left/Right keys step through them.
 */
export default function PhotoGallery({
  images,
  className = 'flex flex-wrap gap-2',
  thumbClassName = 'h-24 w-24 rounded-md',
  thumbSize = 96,
  label = 'Photo',
}: PhotoGalleryProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [index, setIndex] = React.useState<number | null>(null);
  const count = images.length;
  const many = count > 1;

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (index !== null && !dialog.open) dialog.showModal();
    else if (index === null && dialog.open) dialog.close();
  }, [index]);

  if (count === 0) return null;

  const close = () => setIndex(null);
  const step = (delta: number) =>
    setIndex((i) => (i === null ? i : (i + delta + count) % count));

  const navButton =
    'absolute top-1/2 -translate-y-1/2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white';

  return (
    <>
      <div className={className}>
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={many ? `Open ${label.toLowerCase()} ${i + 1} of ${count}` : `Open ${label.toLowerCase()}`}
            className="block overflow-hidden rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <img
              src={src}
              alt=""
              className={`${thumbClassName} border border-slate-200 object-cover transition-opacity hover:opacity-90 dark:border-slate-700`}
              width={thumbSize}
              height={thumbSize}
              loading="lazy"
            />
          </button>
        ))}
      </div>

      <dialog
        ref={ref}
        aria-label={many && index !== null ? `${label} ${index + 1} of ${count}` : label}
        // Esc fires `cancel`; route it through state so `index` stays the
        // single source of truth.
        onCancel={(e) => {
          e.preventDefault();
          close();
        }}
        onKeyDown={(e) => {
          if (!many) return;
          if (e.key === 'ArrowLeft') step(-1);
          if (e.key === 'ArrowRight') step(1);
        }}
        // React bubbles through the component tree, not the DOM, so stop
        // clicks here from reaching a clickable card around the gallery.
        // A click on the dialog itself or the frame around the photo is the
        // backdrop.
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.backdrop) close();
        }}
        className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-slate-950/85"
      >
        {index !== null ? (
          <div data-backdrop="true" className="relative flex h-full w-full items-center justify-center p-4 sm:p-12">
            <img
              src={images[index]}
              alt={many ? `${label} ${index + 1} of ${count}` : label}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              autoFocus
              className="absolute right-3 top-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X className="h-6 w-6" aria-hidden />
            </button>

            {many ? (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={`${navButton} left-3`}>
                  <ChevronLeft className="h-6 w-6" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next photo" className={`${navButton} right-3`}>
                  <ChevronRight className="h-6 w-6" aria-hidden />
                </button>
                <p
                  aria-live="polite"
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-slate-900/70 px-3 py-1 text-sm text-white"
                >
                  {index + 1} of {count}
                </p>
              </>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  );
}
