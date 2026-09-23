import React from 'react';

type StarRatingProps = {
  value: number; // 0..5
  outOf?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
};

const sizeMap = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
} as const;

const STAR_PATH =
  'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z';

function FullStar({ size }: { size: keyof typeof sizeMap }) {
  return (
    <svg className={`${sizeMap[size]} text-amber-400`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d={STAR_PATH} />
    </svg>
  );
}

function EmptyStar({ size }: { size: keyof typeof sizeMap }) {
  return (
    <svg
      className={`${sizeMap[size]} text-amber-400`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeWidth="1.5" d={STAR_PATH} />
    </svg>
  );
}

/**
 * A filled star clipped to half width over an outlined one.
 *
 * The previous version painted a `<linearGradient id="half">`, which had two
 * problems: the gradient stop read `currentColor` from an element with no
 * colour class, so half stars rendered in the inherited slate rather than
 * amber; and the id was emitted once per rating, so a page of provider cards
 * contained many elements sharing `id="half"`.
 */
function HalfStar({ size }: { size: keyof typeof sizeMap }) {
  return (
    <span className={`relative inline-block shrink-0 ${sizeMap[size]}`}>
      <span className="absolute inset-0">
        <EmptyStar size={size} />
      </span>
      <span className="absolute inset-0 w-1/2 overflow-hidden">
        <FullStar size={size} />
      </span>
    </span>
  );
}

export function StarRating({ value, outOf = 5, size = 'md', showValue = false, className }: StarRatingProps) {
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), outOf) : 0;
  const full = Math.floor(safeValue);
  const hasHalf = safeValue - full >= 0.5;
  const empty = Math.max(0, outOf - full - (hasHalf ? 1 : 0));

  return (
    <div
      className={['flex items-center gap-1', className || ''].join(' ')}
      role="img"
      aria-label={`${safeValue.toFixed(1)} out of ${outOf} stars`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <FullStar key={`full-${i}`} size={size} />
      ))}
      {hasHalf ? <HalfStar size={size} /> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <EmptyStar key={`empty-${i}`} size={size} />
      ))}
      {showValue ? (
        <span className="ml-1 text-xs text-slate-600 dark:text-slate-400">{safeValue.toFixed(1)}</span>
      ) : null}
    </div>
  );
}

export default StarRating;
