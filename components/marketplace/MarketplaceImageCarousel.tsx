'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  images: string[];
  alt: string;
  className?: string;
};

export default function MarketplaceImageCarousel({ images, alt, className = '' }: Props) {
  const safeImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [index, setIndex] = React.useState(0);
  const total = safeImages.length;
  const [framed, setFramed] = React.useState(false);

  React.useEffect(() => {
    if (index >= total) setIndex(0);
  }, [total, index]);

  function prev() {
    setIndex((i) => (i - 1 + total) % total);
  }
  function next() {
    setIndex((i) => (i + 1) % total);
  }

  if (total === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        className={[
          'aspect-square bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-xl',
          framed ? 'ring-2 ring-blue-500' : '',
        ].join(' ')}
        onClick={() => setFramed((v) => !v)}
        role="button"
        aria-pressed={framed}
        title={framed ? 'Hide frame' : 'Show frame'}
      >
        <img
          key={safeImages[index]}
          src={safeImages[index]}
          alt={alt}
          className="w-full h-full object-cover"
          width={1024}
          height={1024}
        />
      </div>

      {total > 1 ? (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 shadow"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" aria-hidden />
          </button>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            {safeImages.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIndex(i)}
                className={[
                  'shrink-0 rounded-md overflow-hidden border',
                  i === index
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700',
                ].join(' ')}
                aria-label={`View image ${i + 1}`}
              >
                <img
                  src={src}
                  alt=""
                  className="w-16 h-16 object-cover"
                  width={64}
                  height={64}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}


