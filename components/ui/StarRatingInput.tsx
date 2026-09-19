'use client';
import React from 'react';

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  outOf?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  'aria-label'?: string;
};

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
} as const;

export default function StarRatingInput({
  value,
  onChange,
  outOf = 5,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Set rating',
}: StarRatingInputProps) {
  const [hover, setHover] = React.useState<number | null>(null);
  const max = Math.max(1, outOf);
  const current = hover ?? value;

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, (value || 0) + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(1, (value || 0) - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    } else if (e.key === '0') {
      e.preventDefault();
      onChange(0);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={['flex items-center gap-1', className || ''].join(' ')}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }).map((_, idx) => {
        const starValue = idx + 1;
        const active = current >= starValue;
        return (
          <button
            key={starValue}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            className="p-0.5 focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
            onMouseEnter={() => setHover(starValue)}
            onClick={() => onChange(starValue)}
            title={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <svg className={sizeMap[size]} viewBox="0 0 20 20" fill={active ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden>
              <path className="text-amber-400" strokeWidth="1.5" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.95-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}


