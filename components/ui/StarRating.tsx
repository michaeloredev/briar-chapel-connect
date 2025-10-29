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

export function StarRating({ value, outOf = 5, size = 'md', showValue = false, className }: StarRatingProps) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const empty = Math.max(0, outOf - full - (hasHalf ? 1 : 0));

  return (
    <div className={["flex items-center gap-1", className || ''].join(' ')}>
      {Array.from({ length: full }).map((_, i) => (
        <svg key={`full-${i}`} className={sizeMap[size]} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path className="text-amber-400" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ))}
      {hasHalf ? (
        <svg className={sizeMap[size]} viewBox="0 0 20 20" aria-hidden>
          <defs>
            <linearGradient id="half">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ) : null}
      {Array.from({ length: empty }).map((_, i) => (
        <svg key={`empty-${i}`} className={sizeMap[size]} viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden>
          <path className="text-amber-400" strokeWidth="1.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ))}
      {showValue ? (
        <span className="ml-1 text-xs text-slate-600 dark:text-slate-400">{value.toFixed(1)}</span>
      ) : null}
    </div>
  );
}

export default StarRating;
